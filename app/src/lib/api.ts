// REST API client for the Go backend

const API_BASE = '/api'

// ─── Token management ────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
}

export function getUserIdFromToken(): number | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.user_id ?? null
  } catch {
    return null
  }
}

// ─── Type mappings ────────────────────────────────────────────────────────────

const TYPE_TO_RU: Record<string, string> = {
  income: 'Доход',
  expense: 'Расход',
  transfer: 'Перевод',
}

const TYPE_FROM_RU: Record<string, 'income' | 'expense' | 'transfer'> = {
  'Доход': 'income',
  'Расход': 'expense',
  'Перевод': 'transfer',
}

const FREQ_TO_RU: Record<string, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  quarterly: 'Ежемесячно',
  yearly: 'Ежегодно',
}

const FREQ_FROM_RU: Record<string, string> = {
  'Ежедневно': 'daily',
  'Еженедельно': 'weekly',
  'Ежемесячно': 'monthly',
  'Ежегодно': 'yearly',
}

const COLORS = [
  '#0E7490', '#F97316', '#F43F5E', '#8B5CF6',
  '#10B981', '#78716C', '#EC4899', '#3B82F6', '#F59E0B', '#EF4444',
]

const ACCOUNT_COLORS: Record<string, string> = {
  cash: '#22C55E',
  debit: '#0E7490',
  credit: '#F43F5E',
  savings: '#8B5CF6',
  investment: '#F97316',
}

export function getAutoColor(id: number): string {
  return COLORS[Math.abs(id) % COLORS.length]
}

function getAccountColor(type: string): string {
  return ACCOUNT_COLORS[type] ?? '#78716C'
}

// Convert YYYY-MM-DD → DD-MM-YYYY for Go query params
function toGoDate(iso: string): string {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let url = `${API_BASE}${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    }
    const q = qs.toString()
    if (q) url += '?' + q
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any).error ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as T
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type User = {
  id: number
  firstName: string
  secondName: string
  email: string
  name: string
  avatar?: string
}

export type Account = {
  id: number
  name: string
  type: string
  balance: number
  color: string
  icon: string
}

export type Transaction = {
  id: number
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string | null
  date: string
  accountId: number
  accountName?: string
  accountColor?: string
  categoryId: number
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
}

export type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  userId?: number
}

export type Goal = {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  isActive: boolean
  color: string
  icon: string
}

export type Budget = {
  id: number
  name: string
  periodStart: string
  periodEnd: string
  amountLimit: number
  categoryIds: number[]
}

export type BudgetSummary = {
  totalLimit: number
  totalSpent: number
  remaining: number
  percentage: number
}

export type RecurringTransaction = {
  id: number
  name: string
  type: 'income' | 'expense'
  amount: number
  accountId: number
  frequency: string
  dayOfMonth?: number
  isActive: boolean
  categoryName?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('POST', '/users/auth/login', {
    email,
    password_hash: password,
  })
}

export async function getMe(): Promise<User> {
  const userId = getUserIdFromToken()
  if (!userId) throw new Error('Not authenticated')
  const data = await request<{
    id: number
    first_name: string
    second_name: string
    email: string
  }>('GET', `/users/${userId}/get`)
  return {
    id: data.id,
    firstName: data.first_name,
    secondName: data.second_name,
    email: data.email,
    name: [data.first_name, data.second_name].filter(Boolean).join(' '),
  }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

function mapAccount(a: any): Account {
  return {
    id: a.id,
    name: a.name,
    type: a.account_type ?? a.type ?? 'debit',
    balance: Number(a.balance ?? 0),
    color: getAccountColor(a.account_type ?? a.type ?? 'debit'),
    icon: a.account_type ?? a.type ?? 'debit',
  }
}

export async function getAccounts(): Promise<Account[]> {
  const data = await request<any[] | null>('GET', '/accounts')
  return (data ?? []).map(mapAccount)
}

export async function createAccount(input: {
  name: string
  type: string
  balance?: number
  color?: string
  icon?: string
}): Promise<void> {
  await request<unknown>('POST', '/accounts/', {
    name: input.name,
    account_type: input.type,
    balance: input.balance ?? 0,
  })
}

export async function deleteAccount(id: number): Promise<void> {
  await request<unknown>('DELETE', `/accounts/${id}`)
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function mapTransaction(t: any): Transaction {
  const rawDate: string = t.created_at ?? ''
  const date = rawDate ? rawDate.split(' ')[0] : new Date().toISOString().split('T')[0]
  return {
    id: t.id,
    type: TYPE_FROM_RU[t.type] ?? 'expense',
    amount: Number(t.amount ?? 0),
    description: t.comment ?? null,
    date,
    accountId: t.account_id,
    accountName: t.account_name ?? undefined,
    accountColor: getAccountColor('debit'),
    categoryId: t.category_id,
    categoryName: t.category_name ?? undefined,
    categoryColor: getAutoColor(t.category_id ?? 0),
    categoryIcon: 'more-horizontal',
  }
}

export async function getTransactions(params: {
  type?: string
  limit?: number
  offset?: number
  dateFrom?: string
  dateTo?: string
}): Promise<{ items: Transaction[]; hasMore: boolean }> {
  const qp: Record<string, string | number | undefined> = {
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  }
  if (params.type && params.type !== 'all') {
    qp.type = TYPE_TO_RU[params.type] ?? params.type
  }
  if (params.dateFrom) qp.date_from = toGoDate(params.dateFrom)
  if (params.dateTo) qp.date_to = toGoDate(params.dateTo)

  const data = await request<{ transactions: any[] | null }>(
    'GET', '/transactions', undefined, qp,
  )
  const items = (data?.transactions ?? []).map(mapTransaction)
  return { items, hasMore: items.length === (params.limit ?? 20) }
}

export async function createTransaction(input: {
  type: string
  amount: number
  accountId: number
  categoryId?: number
  description?: string
  recipientAccountId?: number
}): Promise<void> {
  await request<unknown>('POST', '/transactions', {
    account_id: input.accountId,
    category_id: input.categoryId ?? 0,
    amount: input.amount,
    comment: input.description ?? null,
    tag_ids: [],
  })
}

export async function deleteTransaction(id: number): Promise<void> {
  await request<unknown>('DELETE', `/transactions/${id}`)
}

// ─── Categories ───────────────────────────────────────────────────────────────

function mapCategory(c: any): Category {
  const mapped = TYPE_FROM_RU[c.type]
  return {
    id: c.id,
    name: c.name,
    type: (mapped === 'transfer' ? 'expense' : mapped ?? 'expense') as 'income' | 'expense',
    color: getAutoColor(c.id),
    icon: 'more-horizontal',
    userId: c.user_id ?? undefined,
  }
}

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const data = await request<any[] | null>('GET', '/category/categories')
  let cats = (data ?? []).map(mapCategory)
  if (type) cats = cats.filter(c => c.type === type)
  return cats
}

export async function createCategory(input: {
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
}): Promise<void> {
  await request<unknown>('POST', '/category/add-category', {
    name: input.name,
    type: TYPE_TO_RU[input.type] ?? input.type,
  })
}

export async function deleteCategory(id: number): Promise<void> {
  await request<unknown>('DELETE', `/category/${id}/delete-category`)
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function mapGoal(g: any): Goal {
  let targetDate: string | undefined
  if (g.target_date) {
    const raw: string = typeof g.target_date === 'string'
      ? g.target_date
      : new Date(g.target_date).toISOString()
    targetDate = raw.split('T')[0]
  }
  return {
    id: g.id,
    name: g.name,
    targetAmount: Number(g.target_amount ?? 0),
    currentAmount: Number(g.current_amount ?? 0),
    targetDate,
    isActive: g.status === 'Активный',
    color: getAutoColor(g.id),
    icon: 'target',
  }
}

export async function getGoals(): Promise<Goal[]> {
  const data = await request<any[] | null>('GET', '/goals')
  return (data ?? []).map(mapGoal)
}

export async function createGoal(input: {
  name: string
  targetAmount: number
  targetDate?: string
  currentAmount?: number
  color?: string
  icon?: string
}): Promise<void> {
  await request<unknown>('POST', '/goals', {
    name: input.name,
    target_amount: input.targetAmount,
    target_date: input.targetDate ?? null,
  })
}

export async function deleteGoal(id: number): Promise<void> {
  await request<unknown>('PATCH', `/goals/${id}/status`, { status: 'Отменен' })
}

export async function contributeToGoal(id: number, amount: number): Promise<void> {
  await request<unknown>('POST', `/goals/${id}/contributions`, {
    transaction_id: null,
    amount,
  })
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

function mapBudget(b: any): Budget {
  const rawStart: string = b.period_start
    ? (typeof b.period_start === 'string'
        ? b.period_start
        : new Date(b.period_start).toISOString())
    : ''
  const rawEnd: string = b.period_end
    ? (typeof b.period_end === 'string'
        ? b.period_end
        : new Date(b.period_end).toISOString())
    : ''
  return {
    id: b.id,
    name: b.name ?? '',
    periodStart: rawStart.split('T')[0],
    periodEnd: rawEnd.split('T')[0],
    amountLimit: Number(b.amount_limit ?? 0),
    categoryIds: b.category_ids ?? [],
  }
}

export async function getBudgets(): Promise<Budget[]> {
  const data = await request<any[] | null>('GET', '/budgets')
  return (data ?? []).map(mapBudget)
}

export async function getBudgetSummary(id: number): Promise<BudgetSummary> {
  const data = await request<{
    amount_limit: number
    total_spent: number
    remaining: number
    percent: number
  }>('GET', `/budgets/${id}/summary`)
  return {
    totalLimit: Number(data.amount_limit ?? 0),
    totalSpent: Number(data.total_spent ?? 0),
    remaining: Number(data.remaining ?? 0),
    percentage: Math.round(Number(data.percent ?? 0)),
  }
}

export async function createBudget(input: {
  month: number
  year: number
  totalLimit: number
  categories?: { categoryId: number; limit: number }[]
}): Promise<void> {
  const m = String(input.month).padStart(2, '0')
  const periodStart = `${input.year}-${m}-01`
  const lastDay = new Date(input.year, input.month, 0).getDate()
  const periodEnd = `${input.year}-${m}-${String(lastDay).padStart(2, '0')}`

  await request<unknown>('POST', '/budgets', {
    name: `Бюджет ${input.month}/${input.year}`,
    period_type: 'Ежемесячный',
    period_start: periodStart,
    period_end: periodEnd,
    amount_limit: input.totalLimit,
  })
}

// ─── Recurring transactions ───────────────────────────────────────────────────

function mapRecurring(r: any): RecurringTransaction {
  const ruType: string = r.rec_transac_type ?? r.type ?? 'Расход'
  const mappedType = TYPE_FROM_RU[ruType]
  const type = mappedType === 'transfer' || !mappedType ? 'expense' : mappedType as 'income' | 'expense'

  const ruFreq: string = r.period_type ?? ''
  const freq = FREQ_FROM_RU[ruFreq] ?? 'monthly'

  const dom = r.day_of_month != null ? Number(r.day_of_month) : undefined

  return {
    id: r.id,
    name: r.comment ?? r.category_name ?? 'Автоплатёж',
    type,
    amount: Number(r.amount ?? 0),
    accountId: r.account_id,
    frequency: freq,
    dayOfMonth: dom,
    isActive: r.status === 'Активен',
    categoryName: r.category_name ?? undefined,
  }
}

export async function getRecurringList(): Promise<RecurringTransaction[]> {
  const data = await request<{ items: any[] | null }>('GET', '/recurring-transactions/list')
  return (data?.items ?? []).map(mapRecurring)
}

export async function createRecurring(input: {
  name: string
  type: string
  amount: number
  accountId: number
  categoryId?: number
  frequency: string
  startDate: string
  endDate?: string
  dayOfMonth?: number
  description?: string
}): Promise<void> {
  const periodType = FREQ_TO_RU[input.frequency] ?? 'Ежемесячно'
  const body: Record<string, unknown> = {
    account_id: input.accountId,
    category_id: input.categoryId ?? 0,
    amount: input.amount,
    period_type: periodType,
    interval: 1,
    start_date: input.startDate,
    timezone: 'UTC',
    tag_ids: [],
    comment: input.name || input.description || null,
  }
  if (input.dayOfMonth) body.day_of_month = input.dayOfMonth
  if (input.endDate) body.end_date = input.endDate
  await request<unknown>('POST', '/recurring-transactions', body)
}

export async function toggleRecurring(id: number, isActive: boolean): Promise<void> {
  const endpoint = isActive
    ? `/recurring-transactions/${id}/pause`
    : `/recurring-transactions/${id}/resume`
  await request<unknown>('PATCH', endpoint)
}

export async function deleteRecurring(id: number): Promise<void> {
  await request<unknown>('DELETE', `/recurring-transactions/${id}/`)
}
