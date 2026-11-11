import { CATEGORIES } from './categories'

export type TourId =
  | 'home'
  | 'expenses'
  | 'budgets'
  | 'bills'
  | 'autopay'
  | 'history'
  | 'wishlist'
  | 'drill'
  | 'groups'
  | 'category-discovery'

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
  route: string
  title: string
  subtitle: string
  estimatedTime: string
  nextTourId?: TourId
  nextLabel?: string
  steps: TourStep[]
}

const totalCategories = CATEGORIES.length
const essentialCount = CATEGORIES.filter((c) => c.essential).length
const flexibleCount = CATEGORIES.filter((c) => !c.essential).length
const billCount = CATEGORIES.filter((c) => c.kind === 'bill').length
const spendingCount = CATEGORIES.filter((c) => c.kind === 'spending').length

export const TOURS: Record<TourId, TourTrack> = {
  home: {
    id: 'home',
    route: '/',
    title: 'Home Dashboard Tour',
    subtitle: 'Understand your balance, emergency reserve, spending pace, approvals, and monthly trend.',
    estimatedTime: '2 min',
    nextTourId: 'expenses',
    nextLabel: 'Next: Expenses',
    steps: [
      {
        id: 'home-balance',
        route: '/',
        selector: '[data-tour="active-balance"]',
        placement: 'bottom',
        title: 'Active Balance & Free Cash',
        description:
          'Shows your cash balance right now, your salary day, and what stays safe to spend after this week’s bills.',
        tip: 'Use Record Expense or Add Bill right here for quick daily updates.',
      },
      {
        id: 'home-reserve',
        route: '/',
        selector: '[data-tour="reserve-card"]',
        placement: 'left',
        title: 'Emergency Reserve & Health Score',
        description:
          'Tracks your protected safety fund separately from everyday spending, along with your latest Crisis Drill score and active bills.',
      },
      {
        id: 'home-spending',
        route: '/',
        selector: '[data-tour="spending-donut"]',
        placement: 'top',
        title: 'Monthly Spending by Category',
        description: `Summarizes this month’s spending against your budget and surfaces your top 4 categories out of ${totalCategories} built-in buckets.`,
      },
      {
        id: 'home-earning',
        route: '/',
        selector: '[data-tour="earning-card"]',
        placement: 'top',
        title: 'Income vs Obligations Pace',
        description:
          'Compares expected monthly inflow against due-this-week bills, current spending, and remaining monthly buffer.',
      },
      {
        id: 'home-transactions',
        route: '/',
        selector: '[data-tour="transactions-actions"]',
        placement: 'left',
        title: 'Pending Confirmations & Activity',
        description:
          'Bills needing your approval appear right at the top so you can approve or skip with one tap, above your latest activity.',
      },
      {
        id: 'home-trend',
        route: '/',
        selector: '[data-tour="spending-trend"]',
        placement: 'top',
        title: '6-Month Spending Trend',
        description:
          'Compare your last 6 months at a glance and switch between All expenses and Excl. bills whenever you want.',
      },
      {
        id: 'home-nav',
        route: '/',
        selector: '[data-tour="sidebar-nav"]',
        mobileSelector: '[data-tour="mobile-bottom-nav"]',
        placement: 'right',
        title: 'App Navigation & Progressive Guides',
        description:
          'Open Expenses, Budgets, Bills, AutoPay, Wishlist, Crisis Drill, or Groups from here. Each section will walk you through its controls on your first visit.',
      },
    ],
  },

  expenses: {
    id: 'expenses',
    route: '/expenses',
    title: 'Expenses Tour',
    subtitle: 'Track daily spending, filter by month or category, and switch between List and Grid views.',
    estimatedTime: '1 min',
    nextTourId: 'budgets',
    nextLabel: 'Next: Budgets',
    steps: [
      {
        id: 'exp-month-bar',
        route: '/expenses',
        selector: '[data-tour="expense-month-bar"]',
        placement: 'bottom',
        title: 'Month Navigator & List / Grid Toggle',
        description:
          'Step through past months, check your total spent, and switch between daily grouped List cards and spreadsheet Grid sorting.',
      },
      {
        id: 'exp-search',
        route: '/expenses',
        selector: '[data-tour="expense-search-form"]',
        placement: 'bottom',
        title: 'Search & Category Filter',
        description: `Search by merchant or note and narrow results down to any of Tinku’s ${totalCategories} categories.`,
      },
      {
        id: 'exp-chips',
        route: '/expenses',
        selector: '[data-tour="expense-category-chips"]',
        placement: 'bottom',
        title: 'Quick Category Chips',
        description:
          'Your top active categories for the month appear here as one-click filter pills showing what each bucket cost.',
      },
      {
        id: 'exp-add',
        route: '/expenses',
        selector: '[data-tour="expense-add-btn"]',
        mobileSelector: '[data-tour="mobile-quick-add"]',
        placement: 'left',
        title: 'Add or Scan Receipt',
        description:
          'Tap Add expense anytime to enter a purchase manually or upload a receipt photo—Tinku automatically updates your balance and budgets.',
      },
    ],
  },

  budgets: {
    id: 'budgets',
    route: '/budgets',
    title: 'Budgets Tour',
    subtitle: 'Monitor category caps split clearly between Essential needs and Flexible spending.',
    estimatedTime: '1 min',
    nextTourId: 'bills',
    nextLabel: 'Next: Bills',
    steps: [
      {
        id: 'bud-overview',
        route: '/budgets',
        selector: '[data-tour="budget-overview"]',
        placement: 'bottom',
        title: 'Monthly Budget Pace',
        description:
          'See how much of your total monthly budget has been used, what remains, and how many days are left in the month.',
      },
      {
        id: 'bud-columns',
        route: '/budgets',
        selector: '[data-tour="budget-columns"]',
        placement: 'top',
        title: 'Essential vs Flexible Split',
        description: `Essential budgets (${essentialCount} protected categories like Rent, Groceries, Health) stay separated from ${flexibleCount} Flexible categories. Bars turn amber at 80% and red over 100%.`,
      },
      {
        id: 'bud-edit',
        route: '/budgets',
        selector: '[data-tour="budget-edit-btn"]',
        placement: 'left',
        title: 'Customize Monthly Limits',
        description:
          'Click Edit limits to set or update monthly caps for the categories your household tracks.',
      },
    ],
  },

  bills: {
    id: 'bills',
    route: '/bills',
    title: 'Bills Tour',
    subtitle: 'Keep recurring rent, utilities, and subscriptions organized with flexible payment modes.',
    estimatedTime: '1 min',
    nextTourId: 'autopay',
    nextLabel: 'Next: AutoPay',
    steps: [
      {
        id: 'bills-modes',
        route: '/bills',
        selector: '[data-tour="bills-modes"]',
        placement: 'bottom',
        title: 'Choose How Each Bill Is Paid',
        description:
          'Every bill can run in Reminder only, Manual approval (you tap Pay), or AutoPay (automatic within your approved limit).',
      },
      {
        id: 'bills-list',
        route: '/bills',
        selector: '[data-tour="bills-list"]',
        placement: 'top',
        title: 'Overdue, Upcoming & Paid Timeline',
        description:
          'Items needing action appear first so you can pay now, postpone 3 days, skip, or mark as paid elsewhere.',
      },
      {
        id: 'bills-add',
        route: '/bills',
        selector: '[data-tour="bills-add-btn"]',
        placement: 'left',
        title: 'Add a Recurring Bill',
        description:
          'Create monthly, quarterly, or annual bills here so upcoming due dates automatically reserve cash on Home.',
      },
    ],
  },

  autopay: {
    id: 'autopay',
    route: '/autopay',
    title: 'AutoPay Tour',
    subtitle: 'Understand safety caps, explicit authorization, and due-date checks.',
    estimatedTime: '1 min',
    nextTourId: 'history',
    nextLabel: 'Next: History',
    steps: [
      {
        id: 'ap-steps',
        route: '/autopay',
        selector: '[data-tour="autopay-steps"]',
        placement: 'bottom',
        title: 'Safety-First AutoPay Rules',
        description:
          'You set a maximum rupees cap and expiry date for each bill. Tinku never charges above your approved cap.',
      },
      {
        id: 'ap-list',
        route: '/autopay',
        selector: '[data-tour="autopay-list"]',
        placement: 'top',
        title: 'Pause, Resume & Adjust Limits',
        description:
          'View active mandates, inspect next execution dates, or pause/revoke any AutoPay rule instantly.',
      },
      {
        id: 'ap-run',
        route: '/autopay',
        selector: '[data-tour="autopay-run-btn"]',
        placement: 'left',
        title: 'Run Scheduler Check',
        description:
          'Trigger today’s due-date check manually anytime to test how due AutoPay bills are verified and logged.',
      },
    ],
  },

  history: {
    id: 'history',
    route: '/history',
    title: 'Payment History Tour',
    subtitle: 'Review your full transaction ledger, payment providers, and statuses.',
    estimatedTime: '1 min',
    nextTourId: 'wishlist',
    nextLabel: 'Next: Wishlist',
    steps: [
      {
        id: 'hist-stats',
        route: '/history',
        selector: '[data-tour="history-stats"]',
        placement: 'bottom',
        title: 'Payment Health Summary',
        description:
          'Check verified payments, pending or failed attempts needing attention, and total payment attempts at a glance.',
      },
      {
        id: 'hist-ledger',
        route: '/history',
        selector: '[data-tour="history-ledger"]',
        placement: 'top',
        title: 'Searchable Audit Ledger',
        description:
          'Inspect payee, INR and USD amounts, PayPal Sandbox vs Simulated provider, and whether a payment was AutoPay or manually approved.',
      },
    ],
  },

  wishlist: {
    id: 'wishlist',
    route: '/wishlist',
    title: 'Wishlist & Goals Tour',
    subtitle: 'Save toward planned purchases without ever touching emergency reserves or upcoming bills.',
    estimatedTime: '1 min',
    nextTourId: 'drill',
    nextLabel: 'Next: Crisis Drill',
    steps: [
      {
        id: 'wish-metrics',
        route: '/wishlist',
        selector: '[data-tour="wishlist-metrics"]',
        placement: 'bottom',
        title: 'Guilt-Free Surplus vs Protected Funds',
        description:
          'Tinku keeps your Emergency Reserve and next 14 days of bills locked first—only true leftover surplus counts toward unlocking goals.',
      },
      {
        id: 'wish-add',
        route: '/wishlist',
        selector: '[data-tour="wishlist-header-action"]',
        placement: 'left',
        title: 'Add & Track Reward Goals',
        description:
          'Add items you want to buy safely, monitor percentage coverage in the table below, and fulfill unlocked goals in one click.',
      },
    ],
  },

  drill: {
    id: 'drill',
    route: '/drill',
    title: 'Crisis Drill Tour',
    subtitle: 'Simulate unexpected shocks and verify how long your household cash and essentials last.',
    estimatedTime: '1 min',
    nextTourId: 'groups',
    nextLabel: 'Next: Groups',
    steps: [
      {
        id: 'drill-sim',
        route: '/drill',
        selector: '[data-tour="drill-workspace"]',
        placement: 'top',
        title: 'Test Real Emergency Scenarios',
        description:
          'Pick a shock like a salary delay, medical bill, or income cut. Tinku shows how your reserve and trimming flexible categories protect essential bills.',
      },
    ],
  },

  groups: {
    id: 'groups',
    route: '/groups',
    title: 'Groups Tour',
    subtitle: 'Split shared rent, groceries, or trip expenses with flatmates and family.',
    estimatedTime: '1 min',
    nextTourId: 'category-discovery',
    nextLabel: 'Explore Categories',
    steps: [
      {
        id: 'groups-list',
        route: '/groups',
        selector: '[data-tour="groups-list"]',
        placement: 'bottom',
        title: 'Shared Ledgers & Net Position',
        description:
          'Each group card shows your net balance—whether others owe you or you owe them—and opens the itemized split history.',
      },
      {
        id: 'groups-new',
        route: '/groups',
        selector: '[data-tour="groups-new-btn"]',
        placement: 'left',
        title: 'Create a New Group',
        description:
          'Start a group for your apartment, household groceries, or trip anytime and record equal or custom splits.',
      },
    ],
  },

  'category-discovery': {
    id: 'category-discovery',
    route: '/help',
    title: 'Category Discovery & Help Tour',
    subtitle: `Browse all ${totalCategories} built-in categories (${spendingCount} spending, ${billCount} bills) and navigation guides.`,
    estimatedTime: '1 min',
    steps: [
      {
        id: 'cat-explorer',
        route: '/help',
        selector: '[data-tour="category-explorer"]',
        placement: 'top',
        title: 'Interactive Category Directory',
        description: `Search all ${totalCategories} categories, filter by Daily Spending vs Recurring Bills or Essential vs Flexible, and jump straight to filtered expenses or budgets.`,
      },
      {
        id: 'help-nav',
        route: '/help',
        selector: '[data-tour="help-nav-map"]',
        placement: 'top',
        title: 'Full Navigation & Feature Guides',
        description:
          'Revisit any page tour, read feature instructions, or check FAQs anytime from Help & Tutorials.',
      },
    ],
  },
}

export const TOUR_ORDER: TourId[] = [
  'home',
  'expenses',
  'budgets',
  'bills',
  'autopay',
  'history',
  'wishlist',
  'drill',
  'groups',
  'category-discovery',
]

export const PAGE_TOUR_BY_ROUTE: Record<string, TourId> = {
  '/': 'home',
  '/expenses': 'expenses',
  '/budgets': 'budgets',
  '/bills': 'bills',
  '/autopay': 'autopay',
  '/history': 'history',
  '/wishlist': 'wishlist',
  '/drill': 'drill',
  '/groups': 'groups',
}
