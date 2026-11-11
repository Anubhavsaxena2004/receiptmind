import { CATEGORIES } from './categories'

export type TourId = 'welcome' | 'navigation' | 'category-discovery'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  route: string
  selector?: string
  mobileSelector?: string
  placement?: TourPlacement
  title: string
  description: string
  tip?: string
}

export interface TourTrack {
  id: TourId
  title: string
  subtitle: string
  estimatedTime: string
  steps: TourStep[]
}

const totalCategories = CATEGORIES.length
const essentialCount = CATEGORIES.filter((c) => c.essential).length
const flexibleCount = CATEGORIES.filter((c) => !c.essential).length
const billCount = CATEGORIES.filter((c) => c.kind === 'bill').length
const spendingCount = CATEGORIES.filter((c) => c.kind === 'spending').length

export const TOURS: Record<TourId, TourTrack> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Tinku',
    subtitle: 'A quick tour of your balance, bills, spending categories, and emergency readiness.',
    estimatedTime: '2 min',
    steps: [
      {
        id: 'welcome-balance',
        route: '/',
        selector: '[data-tour="active-balance"]',
        placement: 'bottom',
        title: 'Active Balance at a Glance',
        description:
          'See how much cash you currently have, when your next salary arrives, and what remains after this week’s scheduled bills.',
        tip: 'Use the Record Expense and Add Bill shortcuts here to update your numbers immediately.',
      },
      {
        id: 'welcome-reserve',
        route: '/',
        selector: '[data-tour="reserve-card"]',
        placement: 'left',
        title: 'Emergency Reserve & Health Score',
        description:
          'Keep an emergency buffer separate from everyday cash. Run a Crisis Drill anytime to check how many days your household can cover.',
      },
      {
        id: 'welcome-spending',
        route: '/',
        selector: '[data-tour="spending-donut"]',
        placement: 'top',
        title: 'Monthly Spending by Category',
        description: `Track day-to-day spending against your monthly budget across ${totalCategories} built-in categories and spot your top 4 expenses fast.`,
      },
      {
        id: 'welcome-transactions',
        route: '/',
        selector: '[data-tour="transactions-actions"]',
        placement: 'left',
        title: 'Approvals & Recent Activity',
        description:
          'Bills waiting for confirmation appear right at the top so you can approve or skip them without digging through menus.',
      },
      {
        id: 'welcome-quick-add',
        route: '/',
        selector: '[data-tour="quick-add"]',
        mobileSelector: '[data-tour="mobile-quick-add"]',
        placement: 'right',
        title: 'Quick Add Expense',
        description:
          'Log a payment in seconds or upload a receipt photo from anywhere in the app using Quick Add.',
      },
      {
        id: 'welcome-sidebar',
        route: '/',
        selector: '[data-tour="sidebar-nav"]',
        mobileSelector: '[data-tour="mobile-bottom-nav"]',
        placement: 'right',
        title: 'Organized Around Your Money Routine',
        description:
          'Navigate cleanly between Track (Expenses & Budgets), Pay (Bills, AutoPay & History), Plan ahead (Wishlist & Crisis Drill), and Together (Groups).',
      },
      {
        id: 'welcome-expenses',
        route: '/expenses',
        selector: '[data-tour="expense-search-form"]',
        placement: 'bottom',
        title: 'Search & Filter Every Rupee',
        description:
          'Filter expenses by keyword, month, or category, or switch to Grid view for spreadsheet-style sorting.',
      },
      {
        id: 'welcome-budgets',
        route: '/budgets',
        selector: '[data-tour="budget-columns"]',
        placement: 'top',
        title: 'Essential vs Flexible Budgets',
        description: `Tinku splits your ${essentialCount} essential categories (like Rent, Groceries, Health) from ${flexibleCount} flexible ones so you always know what to protect first.`,
      },
    ],
  },

  navigation: {
    id: 'navigation',
    title: 'Application Navigation Tutorial',
    subtitle: 'Learn where every menu, search shortcut, alert bell, and account control lives.',
    estimatedTime: '2 min',
    steps: [
      {
        id: 'nav-main',
        route: '/',
        selector: '[data-tour="sidebar-nav"]',
        mobileSelector: '[data-tour="mobile-bottom-nav"]',
        placement: 'right',
        title: 'Main Navigation Sections',
        description:
          'Desktop keeps Track, Pay, Plan ahead, and Together sections pinned on the left. On smaller screens, use the bottom bar and More menu.',
      },
      {
        id: 'nav-overview-pills',
        route: '/',
        selector: '[data-tour="overview-tabs"]',
        placement: 'bottom',
        title: 'Dashboard Quick Jumps',
        description:
          'Switch straight from the Home overview to Expenses, Bills, Budgets, Wishlist, or Crisis Drill from the top pill bar.',
      },
      {
        id: 'nav-quick-add',
        route: '/',
        selector: '[data-tour="quick-add"]',
        mobileSelector: '[data-tour="mobile-quick-add"]',
        placement: 'right',
        title: 'Always-Available Quick Add',
        description:
          'Record new day-to-day spending from any screen with one tap on Quick Add (or the floating + button on mobile).',
      },
      {
        id: 'nav-search',
        route: '/',
        selector: '[data-tour="header-search"]',
        placement: 'bottom',
        title: 'Top Search Bar',
        description:
          'Click Search in the header anytime to jump directly to the Expenses search and filter bar.',
      },
      {
        id: 'nav-notifications',
        route: '/',
        selector: '[data-tour="header-notifications"]',
        placement: 'bottom',
        title: 'Notifications & Due Reminders',
        description:
          'Upcoming bill reminders, AutoPay runs, and budget warnings show an unread badge on the bell icon.',
      },
      {
        id: 'nav-theme',
        route: '/',
        selector: '[data-tour="header-theme"]',
        placement: 'bottom',
        title: 'Light & Dark Theme Switcher',
        description:
          'Toggle between Light and Dark themes right from the header, or pick System preference in Settings.',
      },
      {
        id: 'nav-account',
        route: '/',
        selector: '[data-tour="header-account"]',
        placement: 'bottom',
        title: 'Account & Settings Access',
        description:
          'Signed-in users find Settings, Security, and Log out in the account menu. Guests see Log in and Sign up buttons here.',
      },
      {
        id: 'nav-help-center',
        route: '/',
        selector: '[data-tour="sidebar-help"]',
        mobileSelector: '[data-tour="mobile-more"]',
        placement: 'right',
        title: 'Help, Category Explorer & About',
        description:
          'Revisit tutorials, browse all categories interactively, restart any tour, or read about Tinku anytime from the sidebar Help & About links.',
      },
    ],
  },

  'category-discovery': {
    id: 'category-discovery',
    title: 'Category Discovery Walkthrough',
    subtitle: `Discover Tinku’s ${totalCategories} built-in categories (${spendingCount} daily spending, ${billCount} recurring bills) across screens.`,
    estimatedTime: '2 min',
    steps: [
      {
        id: 'cat-dashboard-breakdown',
        route: '/',
        selector: '[data-tour="spending-donut"]',
        placement: 'top',
        title: '1. Spot Top Categories on Home',
        description:
          'The Spending card summarizes your current month and lists your top 4 spending categories so high-spend areas stand out right away.',
      },
      {
        id: 'cat-expenses-select',
        route: '/expenses',
        selector: '[data-tour="expense-category-select"]',
        placement: 'bottom',
        title: '2. Browse & Select Any Category',
        description: `Every one of Tinku’s ${totalCategories} categories (${CATEGORIES.slice(0, 4)
          .map((c) => c.label)
          .join(', ')}, and more) is available in the category dropdown on Expenses.`,
      },
      {
        id: 'cat-expenses-search',
        route: '/expenses',
        selector: '[data-tour="expense-search-form"]',
        placement: 'bottom',
        title: '3. Combine Search with Category Filters',
        description:
          'Type any merchant, note, or item keyword alongside a selected category, then press Filter to narrow down matching transactions.',
      },
      {
        id: 'cat-expenses-chips',
        route: '/expenses',
        selector: '[data-tour="expense-category-chips"]',
        placement: 'bottom',
        title: '4. One-Click Category Chips',
        description:
          'Top active categories for the selected month appear as quick-filter chips showing total spent per category. Click again to clear.',
      },
      {
        id: 'cat-expenses-grid',
        route: '/expenses',
        selector: '[data-tour="expense-view-toggle"]',
        placement: 'bottom',
        title: '5. Switch Between List & Grid Views',
        description:
          'Use List for grouped daily receipts or switch to Grid for column filtering and sorting across categories.',
      },
      {
        id: 'cat-budgets-columns',
        route: '/budgets',
        selector: '[data-tour="budget-columns"]',
        placement: 'top',
        title: '6. Essential vs Flexible Classification',
        description: `Budgets separate ${essentialCount} Essential categories (protected in Crisis Drills) from ${flexibleCount} Flexible categories. Bars warn at 80% and alert past 100%.`,
      },
      {
        id: 'cat-help-explorer',
        route: '/help',
        selector: '[data-tour="category-explorer"]',
        placement: 'top',
        title: '7. Interactive Category Directory',
        description:
          'Filter all categories by Spending vs Bill or Essential vs Flexible here in the Help Center, inspect details, and jump directly to filtered expenses or budgets.',
      },
    ],
  },
}

export const TOUR_ORDER: TourId[] = ['welcome', 'navigation', 'category-discovery']

