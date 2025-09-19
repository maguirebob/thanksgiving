const { Client } = require('pg');
const { createPhotosTable } = require('../../scripts/create-photos-table');

describe('Photos Table', () => {
  let client;
  let testEventId;

  beforeAll(async () => {
    // Create Photos table if it doesn't exist
    await createPhotosTable();
    
    // Connect to database
    client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    await client.connect();

    // Create a test event for foreign key testing
    const eventResult = await client.query(`
      INSERT INTO "Events" (event_name, event_date, description, menu_image_url)
      VALUES ('Test Thanksgiving 2024', '2024-11-28', 'Test event for photo testing', '/images/test.jpg')
      RETURNING id
    `);
    testEventId = eventResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testEventId) {
      await client.query('DELETE FROM "Events" WHERE id = $1', [testEventId]);
    }
    await client.end();
  });

  describe('Table Structure', () => {
    test('Photos table should exist', async () => {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Photos'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('Photos table should have correct columns', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Photos' 
        ORDER BY ordinal_position;
      `);

      const expectedColumns = [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'event_id', type: 'integer', nullable: false },
        { name: 'filename', type: 'character varying', nullable: false },
        { name: 'original_name', type: 'character varying', nullable: false },
        { name: 'file_path', type: 'text', nullable: false },
        { name: 'file_size', type: 'integer', nullable: true },
        { name: 'mime_type', type: 'character varying', nullable: true },
        { name: 'description', type: 'text', nullable: true },
        { name: 'caption', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp without time zone', nullable: true },
        { name: 'updated_at', type: 'timestamp without time zone', nullable: true }
      ];

      expect(result.rows).toHaveLength(expectedColumns.length);

      expectedColumns.forEach((expectedCol, index) => {
        const actualCol = result.rows[index];
        expect(actualCol.column_name).toBe(expectedCol.name);
        expect(actualCol.data_type).toBe(expectedCol.type);
        expect(actualCol.is_nullable).toBe(expectedCol.nullable ? 'YES' : 'NO');
      });
    });

    test('Photos table should have primary key on id', async () => {
      const result = await client.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'Photos' 
        AND constraint_type = 'PRIMARY KEY';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].constraint_name).toContain('Photos_pkey');
    });

    test('Photos table should have foreign key to Events table', async () => {
      const result = await client.query(`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name='Photos';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].column_name).toBe('event_id');
      expect(result.rows[0].foreign_table_name).toBe('Events');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    test('Photos table should have proper indexes', async () => {
      const result = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'Photos'
        ORDER BY indexname;
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_photos_event_id');
      expect(indexNames).toContain('idx_photos_created_at');
    });
  });

  describe('Data Operations', () => {
    let testPhotoId;

    afterEach(async () => {
      // Clean up test photo
      if (testPhotoId) {
        await client.query('DELETE FROM "Photos" WHERE id = $1', [testPhotoId]);
        testPhotoId = null;
      }
    });

    test('should insert photo successfully', async () => {
      const testPhoto = {
        event_id: testEventId,
        filename: 'test-photo.jpg',
        original_name: 'test-photo.jpg',
        file_path: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        file_size: 96,
        mime_type: 'image/jpeg',
        description: 'Test photo description',
        caption: 'Test photo caption'
      };

      const result = await client.query(`
        INSERT INTO "Photos" (event_id, filename, original_name, file_path, file_size, mime_type, description, caption)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, filename, original_name, description, caption, created_at
      `, [
        testPhoto.event_id,
        testPhoto.filename,
        testPhoto.original_name,
        testPhoto.file_path,
        testPhoto.file_size,
        testPhoto.mime_type,
        testPhoto.description,
        testPhoto.caption
      ]);

      expect(result.rows).toHaveLength(1);
      const insertedPhoto = result.rows[0];
      
      expect(insertedPhoto.id).toBeDefined();
      expect(insertedPhoto.filename).toBe(testPhoto.filename);
      expect(insertedPhoto.original_name).toBe(testPhoto.original_name);
      expect(insertedPhoto.description).toBe(testPhoto.description);
      expect(insertedPhoto.caption).toBe(testPhoto.caption);
      expect(insertedPhoto.created_at).toBeDefined();

      testPhotoId = insertedPhoto.id;
    });

    test('should enforce foreign key constraint', async () => {
      const invalidEventId = 99999; // Non-existent event ID

      await expect(
        client.query(`
          INSERT INTO "Photos" (event_id, filename, original_name, file_path)
          VALUES ($1, $2, $3, $4)
        `, [invalidEventId, 'test.jpg', 'test.jpg', 'base64data'])
      ).rejects.toThrow();
    });

    test('should enforce NOT NULL constraints', async () => {
      // Test missing required fields
      await expect(
        client.query(`
          INSERT INTO "Photos" (event_id, filename, original_name)
          VALUES ($1, $2, $3)
        `, [testEventId, 'test.jpg', 'test.jpg'])
      ).rejects.toThrow();

      await expect(
        client.query(`
          INSERT INTO "Photos" (event_id, filename, file_path)
          VALUES ($1, $2, $3)
        `, [testEventId, 'test.jpg', 'base64data'])
      ).rejects.toThrow();
    });

    test('should update photo metadata', async () => {
      // First insert a photo
      const insertResult = await client.query(`
        INSERT INTO "Photos" (event_id, filename, original_name, file_path, description, caption)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [testEventId, 'test.jpg', 'test.jpg', 'base64data', 'Original description', 'Original caption']);

      testPhotoId = insertResult.rows[0].id;

      // Update the photo
      const updateResult = await client.query(`
        UPDATE "Photos" 
        SET description = $1, caption = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, description, caption, updated_at
      `, ['Updated description', 'Updated caption', testPhotoId]);

      expect(updateResult.rows).toHaveLength(1);
      const updatedPhoto = updateResult.rows[0];
      
      expect(updatedPhoto.description).toBe('Updated description');
      expect(updatedPhoto.caption).toBe('Updated caption');
      expect(updatedPhoto.updated_at).toBeDefined();
    });

    test('should delete photo successfully', async () => {
      // First insert a photo
      const insertResult = await client.query(`
        INSERT INTO "Photos" (event_id, filename, original_name, file_path)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [testEventId, 'test.jpg', 'test.jpg', 'base64data']);

      const photoId = insertResult.rows[0].id;

      // Delete the photo
      const deleteResult = await client.query(`
        DELETE FROM "Photos" WHERE id = $1 RETURNING id
      `, [photoId]);

      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(photoId);

      // Verify photo is deleted
      const verifyResult = await client.query(`
        SELECT id FROM "Photos" WHERE id = $1
      `, [photoId]);

      expect(verifyResult.rows).toHaveLength(0);
    });

    test('should cascade delete when parent event is deleted', async () => {
      // Create a new test event
      const eventResult = await client.query(`
        INSERT INTO "Events" (event_name, event_date, description, menu_image_url)
        VALUES ('Cascade Test Event', '2024-11-28', 'Test event for cascade delete', '/images/test.jpg')
        RETURNING id
      `);
      const cascadeEventId = eventResult.rows[0].id;

      // Insert photos for this event
      const photo1Result = await client.query(`
        INSERT INTO "Photos" (event_id, filename, original_name, file_path)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [cascadeEventId, 'photo1.jpg', 'photo1.jpg', 'base64data1']);

      const photo2Result = await client.query(`
        INSERT INTO "Photos" (event_id, filename, original_name, file_path)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [cascadeEventId, 'photo2.jpg', 'photo2.jpg', 'base64data2']);

      const photo1Id = photo1Result.rows[0].id;
      const photo2Id = photo2Result.rows[0].id;

      // Verify photos exist
      const beforeDelete = await client.query(`
        SELECT id FROM "Photos" WHERE event_id = $1
      `, [cascadeEventId]);
      expect(beforeDelete.rows).toHaveLength(2);

      // Delete the parent event
      await client.query('DELETE FROM "Events" WHERE id = $1', [cascadeEventId]);

      // Verify photos are cascade deleted
      const afterDelete = await client.query(`
        SELECT id FROM "Photos" WHERE event_id = $1
      `, [cascadeEventId]);
      expect(afterDelete.rows).toHaveLength(0);

      // Verify specific photos are deleted
      const photo1Check = await client.query('SELECT id FROM "Photos" WHERE id = $1', [photo1Id]);
      const photo2Check = await client.query('SELECT id FROM "Photos" WHERE id = $1', [photo2Id]);
      
      expect(photo1Check.rows).toHaveLength(0);
      expect(photo2Check.rows).toHaveLength(0);
    });
  });

  describe('Query Performance', () => {
    test('should efficiently query photos by event_id', async () => {
      // Insert multiple test photos
      const photos = [];
      for (let i = 0; i < 5; i++) {
        const result = await client.query(`
          INSERT INTO "Photos" (event_id, filename, original_name, file_path)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [testEventId, `test${i}.jpg`, `test${i}.jpg`, `base64data${i}`]);
        photos.push(result.rows[0].id);
      }

      // Query photos by event_id
      const startTime = Date.now();
      const result = await client.query(`
        SELECT id, filename, description, caption, created_at 
        FROM "Photos" 
        WHERE event_id = $1 
        ORDER BY created_at DESC
      `, [testEventId]);
      const endTime = Date.now();

      expect(result.rows).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with index

      // Clean up
      await client.query('DELETE FROM "Photos" WHERE event_id = $1', [testEventId]);
    });
  });
});
