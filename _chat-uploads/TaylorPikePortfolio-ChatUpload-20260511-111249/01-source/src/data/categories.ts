// Portfolio category data.
//
// Editable category records live in categories.json so the local editor can
// add, remove, and rename categories without changing TypeScript.

import categoriesJson from './categories.json';

export type PortfolioCategory = {
  id: string;
  label: string;
};

export const portfolioCategories = categoriesJson as PortfolioCategory[];

export function getCategoryLabel(categoryId: string) {
  const category = portfolioCategories.find((item) => item.id === categoryId);

  if (category) {
    return category.label;
  }

  return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
}

export function getDefaultCategoryId() {
  return portfolioCategories[0]?.id ?? 'personal';
}

export function isValidCategoryId(categoryId: string) {
  return portfolioCategories.some((category) => category.id === categoryId);
}