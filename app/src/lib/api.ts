// REST API client for the Go backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

type ApiRecord = Record<string, unknown>

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
    const encodedPayload = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const paddedPayload = encodedPayload.padEnd(
      encodedPayload.length + ((4 - encodedPayload.length % 4) % 4),
      '=',
    )
    const payload = JSON.parse(atob(paddedPayload))
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

const ACCOUNT_TYPE_TO_GO: Record<string, string> = {
  cash: 'Наличные',
  debit: 'Карта',
  credit: 'Карта',
  wallet: 'Кошелек',
  savings: 'Депозит',
  investment: 'Другое',
}

const ACCOUNT_TYPE_FROM_GO: Record<string, string> = {
  'Наличные': 'cash',
  'Карта': 'debit',
  'Кошелек': 'wallet',
  'Депозит': 'savings',
  'Другое': 'investment',
}

const ACCOUNT_COLORS: Record<string, string> = {
  cash: '#22C55E',
  debit: '#0E7490',
  credit: '#F43F5E',
  wallet: '#3B82F6',
  savings: '#8B5CF6',
  investment: '#F97316',
}

export function getAutoColor(id: number): string {
  return COLORS[Math.abs(id) % COLORS.length]
}

function getAccountColor(type: string): string {
  return ACCOUNT_COLORS[ACCOUNT_TYPE_FROM_GO[type] ?? type] ?? '#78716C'
}

// Convert YYYY-MM-DD → DD-MM-YYYY for Go query params
function toGoDate(iso: string): string {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso
}

function fromGoDate(value: unknown): string {
  if (!value) return ''
  const raw = String(value)
  return raw.split('T')[0].split(' ')[0]
}

function fromGoDateTime(value: unknown): string {
  if (!value) return ''
  return String(value).replace(' ', 'T')
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null
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

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = isApiRecord(data) ? data.error : undefined
    if (res.status === 401) {
      clearToken()
    }
    throw new Error(typeof message === 'string' ? message : `HTTP ${res.status}`)
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
  userName?: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string | null
  recipient?: string
  date: string
  createdAt?: string
  updatedAt?: string
  accountId: number
  accountName?: string
  accountColor?: string
  categoryId: number
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
  subcategoryId?: number
  subcategoryName?: string
  merchantId?: number
  merchantName?: string
  tags: string[]
  recurringId?: number
  transferId?: number
  isDeleted?: boolean
}

export type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  userId?: number
}

export type Subcategory = {
  id: number
  categoryId: number
  name: string
  userId?: number
}

export type Merchant = {
  id: number
  name: string
  categoryId: number
  categoryName?: string
}

export type Tag = {
  id: number
  name: string
}

export type RefType = {
  id: number
  name: string
}

export type Transfer = {
  id: number
  amount: number
  date: string
  fromAccountId?: number
  toAccountId?: number
  fromAccountName: string
  toAccountName: string
  comment?: string
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
  priority?: number
}

export type GoalContribution = {
  id: number
  goalId: number
  transactionId?: number
  amount: number
  date: string
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
  accountName?: string
  categoryId: number
  categoryName?: string
  subcategoryId?: number
  merchantId?: number
  tagIds: number[]
  recipient?: string
  startDate: string
  endDate?: string
  nextRunAt: string
  daysUntilNextRun?: number
  frequency: string
  interval: number
  dayOfMonth?: number
  dayOfWeek?: number
  timezone: string
  status: string
  isActive: boolean
  subcategoryName?: string
  merchantName?: string
  tags: string[]
}

export type UserEvent = {
  id: number
  eventType: string
  payload: unknown
  date: string
  ipAddress?: string
  userAgent?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('POST', '/users/auth/login', {
    email,
    password_hash: password,
  })
}

export async function register(input: {
  firstName: string
  secondName: string
  email: string
  password: string
}): Promise<void> {
  await request<unknown>('POST', '/users/auth/register', {
    first_name: input.firstName,
    second_name: input.secondName,
    email: input.email,
    password_hash: input.password,
  })
}

export async function restoreUser(email: string, password: string): Promise<void> {
  await request<unknown>('PATCH', '/users/auth/restore', {
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

export async function updateMe(input: {
  firstName: string
  secondName: string
  email: string
  password: string
}): Promise<void> {
  const userId = getUserIdFromToken()
  if (!userId) throw new Error('Not authenticated')
  await request<unknown>('PATCH', `/users/${userId}/update`, {
    first_name: input.firstName,
    second_name: input.secondName,
    email: input.email,
    password_hash: input.password,
  })
}

export async function deleteMe(): Promise<void> {
  const userId = getUserIdFromToken()
  if (!userId) throw new Error('Not authenticated')
  await request<unknown>('DELETE', `/users/${userId}/delete`)
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

function mapAccount(a: ApiRecord): Account {
  const rawType = String(a.account_type ?? a.type ?? 'Карта')
  const type = ACCOUNT_TYPE_FROM_GO[rawType] ?? rawType
  return {
    id: Number(a.id),
    name: String(a.name ?? ''),
    type,
    balance: Number(a.balance ?? 0),
    color: getAccountColor(type),
    icon: type,
  }
}

export async function getAccounts(): Promise<Account[]> {
  const data = await request<ApiRecord[] | null>('GET', '/accounts')
  return (data ?? []).map(mapAccount)
}

export async function createAccount(input: {
  name: string
  type: string
  balance?: number
  color?: string
  icon?: string
  cardTypeId?: number
  walletTypeId?: number
}): Promise<void> {
  await request<unknown>('POST', '/accounts/', {
    name: input.name,
    account_type: ACCOUNT_TYPE_TO_GO[input.type] ?? input.type,
    balance: input.balance ?? 0,
    card_type_id: input.cardTypeId ?? null,
    wallet_type_id: input.walletTypeId ?? null,
  })
}

export async function updateAccount(id: number, input: {
  name: string
  type: string
  balance: number
  cardTypeId?: number
  walletTypeId?: number
}): Promise<void> {
  await request<unknown>('PATCH', `/accounts/${id}/update`, {
    name: input.name,
    account_type: ACCOUNT_TYPE_TO_GO[input.type] ?? input.type,
    balance: input.balance,
    card_type_id: input.cardTypeId ?? null,
    wallet_type_id: input.walletTypeId ?? null,
  })
}

export async function topupAccount(id: number, amount: number): Promise<void> {
  await request<unknown>('PATCH', `/accounts/${id}/topup`, { balance: amount })
}

export async function withdrawAccount(id: number, amount: number): Promise<void> {
  await request<unknown>('PATCH', `/accounts/${id}/withdrow`, { balance: amount })
}

export async function deleteAccount(id: number): Promise<void> {
  await request<unknown>('DELETE', `/accounts/${id}`)
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function mapTransaction(t: ApiRecord): Transaction {
  const rawDate = t.created_at
  const createdAt = rawDate ? fromGoDateTime(rawDate) : undefined
  const date = rawDate ? fromGoDate(rawDate) : new Date().toISOString().split('T')[0]
  const rawType = String(t.type ?? 'Расход')
  const categoryId = Number(t.category_id ?? 0)
  const subcategoryId = t.subcategory_id == null ? undefined : Number(t.subcategory_id)
  const merchantId = t.merchant_id == null ? undefined : Number(t.merchant_id)
  return {
    id: Number(t.id),
    userName: optionalString(t.user_name),
    type: TYPE_FROM_RU[rawType] ?? 'expense',
    amount: Number(t.amount ?? 0),
    description: optionalString(t.comment) ?? null,
    recipient: optionalString(t.recipient),
    date,
    createdAt,
    updatedAt: t.updated_at ? fromGoDateTime(t.updated_at) : undefined,
    accountId: Number(t.account_id),
    accountName: optionalString(t.account_name),
    accountColor: getAccountColor('debit'),
    categoryId,
    categoryName: optionalString(t.category_name),
    categoryColor: getAutoColor(categoryId),
    categoryIcon: 'more-horizontal',
    subcategoryId,
    subcategoryName: optionalString(t.subcategory_name),
    merchantId,
    merchantName: optionalString(t.merchant_name),
    tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
    recurringId: t.recurring_id == null ? undefined : Number(t.recurring_id),
    transferId: t.transfer_id == null ? undefined : Number(t.transfer_id),
    isDeleted: Boolean(t.is_deleted ?? false),
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

  const data = await request<{ transactions: ApiRecord[] | null }>(
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
  subcategoryId?: number
  merchantId?: number
  tagIds?: number[]
  description?: string
  recipient?: string
  recipientAccountId?: number
}): Promise<{ id: number }> {
  if (input.type === 'transfer') {
    if (!input.recipientAccountId) {
      throw new Error('Recipient account is required for transfers')
    }
    await request<unknown>('POST', '/tranfers', {
      from_account_id: input.accountId,
      to_account_id: input.recipientAccountId,
      amount: input.amount,
      comment: input.description ?? null,
    })
    return { id: 0 }
  }

  if (!input.categoryId) {
    throw new Error('Category is required')
  }

  const data = await request<{ id: number }>('POST', '/transactions', {
    account_id: input.accountId,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId ?? null,
    merchant_id: input.merchantId ?? null,
    amount: input.amount,
    comment: input.description ?? null,
    recipient: input.recipient ?? null,
    tag_ids: input.tagIds ?? [],
  })
  return { id: data.id }
}

export async function updateTransaction(id: number, input: {
  amount: number
  accountId: number
  categoryId: number
  subcategoryId?: number
  merchantId?: number
  tagIds?: number[]
  description?: string
  recipient?: string
}): Promise<void> {
  await request<unknown>('PATCH', `/transactions/${id}`, {
    account_id: input.accountId,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId ?? null,
    merchant_id: input.merchantId ?? null,
    amount: input.amount,
    comment: input.description ?? null,
    recipient: input.recipient ?? null,
    tag_ids: input.tagIds ?? [],
  })
}

export async function deleteTransaction(id: number): Promise<void> {
  await request<unknown>('DELETE', `/transactions/${id}`)
}

function mapTransfer(t: ApiRecord): Transfer {
  return {
    id: Number(t.id),
    amount: Number(t.amount ?? 0),
    date: fromGoDate(t.created_at),
    fromAccountId: t.from_account_id == null ? undefined : Number(t.from_account_id),
    toAccountId: t.to_account_id == null ? undefined : Number(t.to_account_id),
    fromAccountName: String(t.acc_from_name ?? ''),
    toAccountName: String(t.acc_to_name ?? ''),
    comment: optionalString(t.comment),
  }
}

export async function getTransfers(params: {
  limit?: number
  offset?: number
  accountId?: number
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
} = {}): Promise<Transfer[]> {
  const qp: Record<string, string | number | undefined> = {
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    account_id: params.accountId,
    min_amount: params.minAmount,
    max_amount: params.maxAmount,
  }
  if (params.dateFrom) qp.date_from = toGoDate(params.dateFrom)
  if (params.dateTo) qp.date_to = toGoDate(params.dateTo)
  const data = await request<{ tranfers: ApiRecord[] | null }>('GET', '/tranfers', undefined, qp)
  return (data.tranfers ?? []).map(mapTransfer)
}

// ─── Categories ───────────────────────────────────────────────────────────────

function mapCategory(c: ApiRecord): Category {
  const mapped = TYPE_FROM_RU[String(c.type ?? '')]
  const id = Number(c.id)
  return {
    id,
    name: String(c.name ?? ''),
    type: (mapped === 'transfer' ? 'expense' : mapped ?? 'expense') as 'income' | 'expense',
    color: getAutoColor(id),
    icon: 'more-horizontal',
    userId: typeof c.user_id === 'number' ? c.user_id : undefined,
  }
}

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const data = await request<ApiRecord[] | null>('GET', '/category/categories')
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

export async function updateCategory(id: number, input: {
  name: string
  type: 'income' | 'expense'
}): Promise<void> {
  await request<unknown>('PATCH', `/category/${id}/update-category`, {
    name: input.name,
    type: TYPE_TO_RU[input.type] ?? input.type,
  })
}

export async function deleteCategory(id: number): Promise<void> {
  await request<unknown>('DELETE', `/category/${id}/delete-category`)
}

function mapSubcategory(s: ApiRecord): Subcategory {
  return {
    id: Number(s.id),
    categoryId: Number(s.category_id ?? 0),
    name: String(s.subcategory_name ?? s.name ?? ''),
    userId: typeof s.user_id === 'number' ? s.user_id : undefined,
  }
}

export async function getSubcategories(categoryId: number): Promise<Subcategory[]> {
  const data = await request<ApiRecord[] | null>('GET', `/category/${categoryId}/subcategories`)
  return (data ?? []).map(mapSubcategory)
}

export async function createSubcategory(input: {
  categoryId: number
  name: string
}): Promise<void> {
  await request<unknown>('POST', '/category/add-subcategory', {
    category_id: input.categoryId,
    name: input.name,
  })
}

export async function updateSubcategory(id: number, input: {
  categoryId: number
  name: string
}): Promise<void> {
  await request<unknown>('PATCH', `/category/${id}/update-subcategory`, {
    category_id: input.categoryId,
    name: input.name,
  })
}

export async function deleteSubcategory(id: number): Promise<void> {
  await request<unknown>('DELETE', `/category/${id}/delete-subcategory`)
}

function mapMerchant(m: ApiRecord): Merchant {
  return {
    id: Number(m.id),
    name: String(m.merchant_name ?? m.name ?? ''),
    categoryId: Number(m.category_id ?? 0),
    categoryName: optionalString(m.category_name),
  }
}

export async function getMerchants(): Promise<Merchant[]> {
  const data = await request<ApiRecord[] | null>('GET', '/merchant')
  return (data ?? []).map(mapMerchant)
}

export async function createMerchant(input: {
  name: string
  categoryId: number
}): Promise<void> {
  await request<unknown>('POST', '/merchant', {
    name: input.name,
    category_id: input.categoryId,
  })
}

export async function updateMerchant(id: number, input: {
  name: string
  categoryId: number
}): Promise<void> {
  await request<unknown>('PATCH', `/merchant/${id}`, {
    name: input.name,
    category_id: input.categoryId,
  })
}

export async function deleteMerchant(id: number): Promise<void> {
  await request<unknown>('DELETE', `/merchant/${id}`)
}

function mapTag(t: ApiRecord): Tag {
  return {
    id: Number(t.id),
    name: String(t.tag_name ?? t.name ?? ''),
  }
}

export async function getTags(): Promise<Tag[]> {
  const data = await request<ApiRecord[] | null>('GET', '/tag')
  return (data ?? []).map(mapTag)
}

export async function createTag(name: string): Promise<void> {
  await request<unknown>('POST', '/tag', { name })
}

export async function updateTag(id: number, name: string): Promise<void> {
  await request<unknown>('PATCH', `/tag/${id}`, { name, category_id: 0 })
}

export async function deleteTag(id: number): Promise<void> {
  await request<unknown>('DELETE', `/tag/${id}`)
}

function mapRefType(t: ApiRecord): RefType {
  return {
    id: Number(t.id),
    name: String(t.name ?? ''),
  }
}

export async function getCardTypes(): Promise<RefType[]> {
  const data = await request<ApiRecord[] | null>('GET', '/card')
  return (data ?? []).map(mapRefType)
}

export async function getWalletTypes(): Promise<RefType[]> {
  const data = await request<ApiRecord[] | null>('GET', '/wallet')
  return (data ?? []).map(mapRefType)
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function mapGoal(g: ApiRecord): Goal {
  const targetDate = g.target_date ? fromGoDate(g.target_date) : undefined
  const id = Number(g.id)
  return {
    id,
    name: String(g.name ?? ''),
    targetAmount: Number(g.target_amount ?? 0),
    currentAmount: Number(g.current_amount ?? 0),
    targetDate,
    isActive: g.status === 'Активный',
    color: getAutoColor(id),
    icon: 'target',
    priority: g.priority != null ? Number(g.priority) : undefined,
  }
}

export async function getGoals(): Promise<Goal[]> {
  const data = await request<ApiRecord[] | null>('GET', '/goals')
  return (data ?? []).map(mapGoal)
}

export async function createGoal(input: {
  name: string
  targetAmount: number
  targetDate?: string
  currentAmount?: number
  color?: string
  icon?: string
  priority?: number
}): Promise<void> {
  await request<unknown>('POST', '/goals', {
    name: input.name,
    target_amount: input.targetAmount,
    target_date: input.targetDate ?? null,
    priority: input.priority ?? null,
  })
}

export async function updateGoal(id: number, input: {
  name: string
  targetAmount: number
  targetDate?: string
  priority?: number
}): Promise<void> {
  await request<unknown>('PATCH', `/goals/${id}`, {
    name: input.name,
    target_amount: input.targetAmount,
    target_date: input.targetDate ?? null,
    priority: input.priority ?? null,
  })
}

export async function deleteGoal(id: number): Promise<void> {
  await request<unknown>('PATCH', `/goals/${id}/status`, { status: 'Отменен' })
}

export async function contributeToGoal(id: number, amount: number, transactionId: number): Promise<void> {
  await request<unknown>('POST', `/goals/${id}/contributions`, {
    transaction_id: transactionId,
    amount,
  })
}

function mapGoalContribution(c: ApiRecord): GoalContribution {
  const txId = c.transaction_id == null ? undefined : Number(c.transaction_id)
  return {
    id: Number(c.id),
    goalId: Number(c.goal_id),
    transactionId: txId !== undefined && Number.isFinite(txId) && txId > 0 ? txId : undefined,
    amount: Number(c.amount ?? 0),
    date: fromGoDate(c.created_at),
  }
}

export async function getGoalContributions(goalId: number): Promise<GoalContribution[]> {
  const data = await request<ApiRecord[] | null>('GET', `/goals/${goalId}/contributions`)
  return (data ?? []).map(mapGoalContribution)
}

export async function deleteGoalContribution(id: number): Promise<void> {
  await request<unknown>('DELETE', `/goal-contributions/${id}`)
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

function mapBudget(b: ApiRecord): Budget {
  const categoryIds = Array.isArray(b.category_ids)
    ? b.category_ids.map(Number).filter(Number.isFinite)
    : []

  return {
    id: Number(b.id),
    name: String(b.name ?? ''),
    periodStart: fromGoDate(b.period_start),
    periodEnd: fromGoDate(b.period_end),
    amountLimit: Number(b.amount_limit ?? 0),
    categoryIds,
  }
}

export async function getBudgets(): Promise<Budget[]> {
  const data = await request<ApiRecord[] | null>('GET', '/budgets')
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

export async function updateBudget(id: number, input: {
  name: string
  periodStart: string
  periodEnd: string
  amountLimit: number
}): Promise<void> {
  await request<unknown>('PATCH', `/budgets/${id}`, {
    name: input.name,
    period_type: 'Ежемесячный',
    period_start: input.periodStart,
    period_end: input.periodEnd,
    amount_limit: input.amountLimit,
  })
}

export async function deleteBudget(id: number): Promise<void> {
  await request<unknown>('DELETE', `/budgets/${id}`)
}

export async function addBudgetCategories(id: number, categoryIds: number[]): Promise<void> {
  await request<unknown>('POST', `/budgets/${id}/categories`, { category_ids: categoryIds })
}

export async function removeBudgetCategory(id: number, categoryId: number): Promise<void> {
  await request<unknown>('DELETE', `/budgets/${id}/categories/${categoryId}`)
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

  if (input.categories?.length) {
    const budgets = await getBudgets()
    const created = budgets.find((budget) =>
      budget.periodStart === periodStart && budget.periodEnd === periodEnd
    )
    if (created) {
      await request<unknown>('POST', `/budgets/${created.id}/categories`, {
        category_ids: input.categories.map((category) => category.categoryId),
      })
    }
  }
}

// ─── Recurring transactions ───────────────────────────────────────────────────

function mapRecurring(r: ApiRecord): RecurringTransaction {
  const ruType = String(r.rec_transac_type ?? r.type ?? 'Расход')
  const mappedType = TYPE_FROM_RU[ruType]
  const type = mappedType === 'transfer' || !mappedType ? 'expense' : mappedType as 'income' | 'expense'

  const ruFreq = String(r.period_type ?? '')
  const freq = FREQ_FROM_RU[ruFreq] ?? 'monthly'

  const dom = r.day_of_month != null ? Number(r.day_of_month) : undefined
  const dow = r.day_of_week != null ? Number(r.day_of_week) : undefined
  const nextRunAt = fromGoDateTime(r.next_run_at)
  const nextRunDate = nextRunAt ? new Date(nextRunAt.replace(' ', 'T')) : null
  const daysUntilNextRun = nextRunDate && Number.isFinite(nextRunDate.getTime())
    ? Math.max(0, Math.ceil((nextRunDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined

  return {
    id: Number(r.id),
    name: optionalString(r.comment) ?? optionalString(r.category_name) ?? 'Автоплатёж',
    type,
    amount: Number(r.amount ?? 0),
    accountId: Number(r.account_id),
    accountName: optionalString(r.account_name),
    categoryId: Number(r.category_id ?? 0),
    categoryName: optionalString(r.category_name),
    subcategoryId: r.subcategory_id == null ? undefined : Number(r.subcategory_id),
    merchantId: r.merchant_id == null ? undefined : Number(r.merchant_id),
    tagIds: Array.isArray(r.tag_ids) ? r.tag_ids.map(Number).filter(Number.isFinite) : [],
    recipient: optionalString(r.recipient),
    startDate: fromGoDate(r.start_date),
    endDate: r.end_date ? fromGoDate(r.end_date) : undefined,
    nextRunAt,
    daysUntilNextRun,
    frequency: freq,
    interval: Number(r.interval ?? 1) || 1,
    dayOfMonth: dom,
    dayOfWeek: dow,
    timezone: String(r.timezone ?? 'UTC'),
    status: String(r.status ?? ''),
    isActive: r.status === 'Активен',
    subcategoryName: optionalString(r.subcategory_name),
    merchantName: optionalString(r.merchant_name),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
  }
}

export async function getRecurringList(): Promise<RecurringTransaction[]> {
  const data = await request<{ items: ApiRecord[] | null }>('GET', '/recurring-transactions/list')
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
  interval?: number
  dayOfMonth?: number
  dayOfWeek?: number
  subcategoryId?: number
  merchantId?: number
  tagIds?: number[]
  recipient?: string
  description?: string
}): Promise<void> {
  if (!input.categoryId) {
    throw new Error('Category is required')
  }

  const periodType = FREQ_TO_RU[input.frequency] ?? 'Ежемесячно'
  const body: Record<string, unknown> = {
    account_id: input.accountId,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId ?? null,
    merchant_id: input.merchantId ?? null,
    type: TYPE_TO_RU[input.type] ?? input.type,
    amount: input.amount,
    period_type: periodType,
    interval: input.interval ?? 1,
    start_date: input.startDate,
    timezone: 'UTC',
    tag_ids: input.tagIds ?? [],
    recipient: input.recipient ?? null,
    comment: input.name || input.description || null,
  }
  if (input.dayOfMonth) body.day_of_month = input.dayOfMonth
  if (input.dayOfWeek) body.day_of_week = input.dayOfWeek
  if (input.endDate) body.end_date = input.endDate
  await request<unknown>('POST', '/recurring-transactions', body)
}

export async function updateRecurring(id: number, input: {
  name: string
  type: string
  amount: number
  accountId: number
  categoryId: number
  frequency: string
  startDate: string
  endDate?: string
  interval?: number
  dayOfMonth?: number
  dayOfWeek?: number
  subcategoryId?: number
  merchantId?: number
  tagIds?: number[]
  recipient?: string
  description?: string
}): Promise<void> {
  const periodType = FREQ_TO_RU[input.frequency] ?? 'Ежемесячно'
  const body: Record<string, unknown> = {
    account_id: input.accountId,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId ?? null,
    merchant_id: input.merchantId ?? null,
    type: TYPE_TO_RU[input.type] ?? input.type,
    amount: input.amount,
    period_type: periodType,
    interval: input.interval ?? 1,
    start_date: input.startDate,
    tag_ids: input.tagIds ?? [],
    recipient: input.recipient ?? null,
    comment: input.name || input.description || null,
  }
  if (input.dayOfMonth) body.day_of_month = input.dayOfMonth
  if (input.dayOfWeek) body.day_of_week = input.dayOfWeek
  if (input.endDate) body.end_date = input.endDate
  await request<unknown>('PATCH', `/recurring-transactions/${id}`, body)
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

function mapUserEvent(e: ApiRecord): UserEvent {
  return {
    id: Number(e.id),
    eventType: String(e.event_type ?? ''),
    payload: e.payload ?? null,
    date: fromGoDate(e.created_at),
    ipAddress: optionalString(e.ip_address),
    userAgent: optionalString(e.user_agent),
  }
}

export async function getUserEvents(params: {
  eventType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
} = {}): Promise<UserEvent[]> {
  const qp: Record<string, string | number | undefined> = {
    event_type: params.eventType,
    limit: params.limit ?? 30,
    offset: params.offset ?? 0,
  }
  if (params.dateFrom) qp.date_from = toGoDate(params.dateFrom)
  if (params.dateTo) qp.date_to = toGoDate(params.dateTo)
  const data = await request<ApiRecord[] | null>('GET', '/user-events', undefined, qp)
  return (data ?? []).map(mapUserEvent)
}
