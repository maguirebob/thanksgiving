/**
 * Recipe Model Tests
 * Tests for the Recipe Prisma model functionality
 */

import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('Recipe Model', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await testUtils.cleanupTestData(prisma);
  });

  describe('Recipe Creation', () => {
    test('should create a recipe with all required fields', async () => {
      // Create a test event first
      const event = await testUtils.createTestEvent(prisma);
      
      // Create a test user
      const user = await testUtils.createTestUser(prisma);

      const recipeData = {
        event_id: event.event_id,
        user_id: user.user_id,
        title: 'Grandma\'s Turkey Recipe',
        description: 'A traditional Thanksgiving turkey recipe',
        ingredients: '1 whole turkey (12-15 lbs)\n1/2 cup butter\nSalt and pepper to taste',
        instructions: '1. Preheat oven to 325°F\n2. Season turkey with salt and pepper\n3. Place in roasting pan\n4. Roast for 3-4 hours until internal temperature reaches 165°F',
        prep_time: 30,
        cook_time: 240,
        servings: 8,
        difficulty_level: 'Medium',
        category: 'Main Course',
        is_featured: true
      };

      const recipe = await prisma.recipe.create({
        data: recipeData
      });

      expect(recipe).toBeDefined();
      expect(recipe.title).toBe('Grandma\'s Turkey Recipe');
      expect(recipe.event_id).toBe(event.event_id);
      expect(recipe.user_id).toBe(user.user_id);
      expect(recipe.difficulty_level).toBe('Medium');
      expect(recipe.category).toBe('Main Course');
      expect(recipe.is_featured).toBe(true);
    });

    test('should create a recipe with minimal required fields', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const recipeData = {
        event_id: event.event_id,
        title: 'Simple Side Dish',
        ingredients: 'Potatoes, butter, salt',
        instructions: 'Boil potatoes, add butter and salt'
      };

      const recipe = await prisma.recipe.create({
        data: recipeData
      });

      expect(recipe).toBeDefined();
      expect(recipe.title).toBe('Simple Side Dish');
      expect(recipe.event_id).toBe(event.event_id);
      expect(recipe.user_id).toBeNull(); // Optional field
      expect(recipe.is_featured).toBe(false); // Default value
    });

    test('should enforce foreign key constraints', async () => {
      const recipeData = {
        event_id: 99999, // Non-existent event
        title: 'Invalid Recipe',
        ingredients: 'Test ingredients',
        instructions: 'Test instructions'
      };

      await expect(
        prisma.recipe.create({ data: recipeData })
      ).rejects.toThrow();
    });
  });

  describe('Recipe Relationships', () => {
    test('should include event relationship', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        },
        include: {
          event: true,
          user: true
        }
      });

      expect(recipe.event).toBeDefined();
      expect(recipe.event.event_name).toBe(event.event_name);
      expect(recipe.user).toBeDefined();
      expect(recipe.user?.username).toBe(user.username);
    });

    test('should cascade delete when event is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        }
      });

      // Delete the event
      await prisma.event.delete({
        where: { event_id: event.event_id }
      });

      // Recipe should be deleted due to cascade
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { recipe_id: recipe.recipe_id }
      });

      expect(deletedRecipe).toBeNull();
    });
  });

  describe('Recipe Queries', () => {
    test('should find recipes by event', async () => {
      const event = await testUtils.createTestEvent(prisma);

      // Create multiple recipes for the same event
      await prisma.recipe.createMany({
        data: [
          {
            event_id: event.event_id,
            title: 'Recipe 1',
            ingredients: 'Ingredients 1',
            instructions: 'Instructions 1'
          },
          {
            event_id: event.event_id,
            title: 'Recipe 2',
            ingredients: 'Ingredients 2',
            instructions: 'Instructions 2'
          }
        ]
      });

      const recipes = await prisma.recipe.findMany({
        where: { event_id: event.event_id }
      });

      expect(recipes).toHaveLength(2);
      expect(recipes[0]?.title).toBe('Recipe 1');
      expect(recipes[1]?.title).toBe('Recipe 2');
    });

    test('should find featured recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);

      await prisma.recipe.createMany({
        data: [
          {
            event_id: event.event_id,
            title: 'Featured Recipe',
            ingredients: 'Ingredients',
            instructions: 'Instructions',
            is_featured: true
          },
          {
            event_id: event.event_id,
            title: 'Regular Recipe',
            ingredients: 'Ingredients',
            instructions: 'Instructions',
            is_featured: false
          }
        ]
      });

      const featuredRecipes = await prisma.recipe.findMany({
        where: { is_featured: true }
      });

      expect(featuredRecipes).toHaveLength(1);
      expect(featuredRecipes[0]?.title).toBe('Featured Recipe');
    });
  });
});
