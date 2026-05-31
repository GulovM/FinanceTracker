package repo

import (
	"Project/internal/domain"
	"database/sql"
	"time"
)

type dbUsers struct {
	ID           int          `db:"id"`
	FirstName    string       `db:"first_name"`
	SecondName   string       `db:"second_name"`
	Email        string       `db:"email"`
	PasswordHash string       `db:"password_hash"`
	CreatedAt    time.Time    `db:"created_at"`
	IsDeleted    bool         `db:"is_deleted"`
	DeletedAt    sql.NullTime `db:"deleted_at"`
}

func (du *dbUsers) ToEntity() *domain.User {
	var deletedAt *time.Time
	if du.DeletedAt.Valid {
		t := du.DeletedAt.Time
		deletedAt = &t
	}
	return &domain.User{
		ID:           du.ID,
		FirstName:    du.FirstName,
		SecondName:   du.SecondName,
		Email:        du.Email,
		PasswordHash: du.PasswordHash,
		CreatedAt:    du.CreatedAt,
		IsDeleted:    du.IsDeleted,
		DeletedAt:    deletedAt,
	}
}

type dbCardType struct {
	ID   int    `db:"id"`
	Name string `db:"name"`
}

func (dc *dbCardType) ToEntity() *domain.CardTypes {
	return &domain.CardTypes{
		ID:   dc.ID,
		Name: dc.Name,
	}
}

type dbWalletType struct {
	ID   int    `db:"id"`
	Name string `db:"name"`
}

func (dw *dbWalletType) ToEntity() *domain.WalletTypes {
	return &domain.WalletTypes{
		ID:   dw.ID,
		Name: dw.Name,
	}
}

type dbAccount struct {
	ID             int            `db:"id"`
	UserName       string         `db:"user_name"`
	Name           string         `db:"name"`
	AccountType    string         `db:"account_type"`
	Balance        float64        `db:"balance"`
	WalletTypeName sql.NullString `db:"wallet_type_name"`
	CardTypeName   sql.NullString `db:"card_type_name"`
	CreatedAt      string         `db:"created_at"`
	UpdatedAt      sql.NullString `db:"updated_at"`
}

func (da *dbAccount) ToEntity() *domain.Account {
	var (
		updatedAt                    *time.Time
		walletTypeName, cardTypeName *string
	)
	if da.UpdatedAt.Valid {
		updatedAt = parseNullableTime(da.UpdatedAt)
	}
	if da.WalletTypeName.Valid {
		value := da.WalletTypeName.String
		walletTypeName = &value
	}
	if da.CardTypeName.Valid {
		value := da.CardTypeName.String
		cardTypeName = &value
	}

	return &domain.Account{
		ID:             da.ID,
		UserName:       da.UserName,
		Name:           da.Name,
		AccountType:    da.AccountType,
		Balance:        da.Balance,
		WalletTypeName: walletTypeName,
		CardTypeName:   cardTypeName,
		CreatedAt:      parseTime(da.CreatedAt),
		UpdatedAt:      updatedAt,
	}
}

type dbCategory struct {
	ID        int            `db:"id"`
	UserID    sql.NullInt64  `db:"user_id"`
	UserName  sql.NullString `db:"user_name"`
	Name      string         `db:"name"`
	Type      string         `db:"type"`
	CreatedAt string         `db:"created_at"`
	UpdatedAt sql.NullString `db:"updated_at"`
	IsDeleted bool           `db:"is_deleted"`
	DeletedAt sql.NullTime   `db:"deleted_at"`
}

func (dc *dbCategory) ToEntity() *domain.Category {
	var (
		updatedAt, deletedAt *time.Time
		userID               *int
		userName             *string
		i                    int
	)
	if dc.UpdatedAt.Valid {
		updatedAt = parseNullableTime(dc.UpdatedAt)
	}
	if dc.DeletedAt.Valid {
		t := dc.DeletedAt.Time
		deletedAt = &t
	}
	if dc.UserID.Valid {
		i = int(dc.UserID.Int64)
		userID = &i
	}
	if dc.UserName.Valid {
		value := dc.UserName.String
		userName = &value
	}
	return &domain.Category{
		ID:        dc.ID,
		UserID:    userID,
		UserName:  userName,
		Name:      dc.Name,
		Type:      dc.Type,
		CreatedAt: parseTime(dc.CreatedAt),
		UpdatedAt: updatedAt,
		IsDeleted: dc.IsDeleted,
		DeletedAt: deletedAt,
	}
}

type dbSubcategory struct {
	ID           int            `db:"id"`
	CategoryID   int            `db:"category_id"`
	CategoryName sql.NullString `db:"category_name"`
	Name         string         `db:"subcategory_name"`
	CreatedAt    string         `db:"created_at"`
	UpdatedAt    sql.NullString `db:"updated_at"`
	UserID       sql.NullInt64  `db:"user_id"`
	UserName     sql.NullString `db:"user_name"`
	IsDeleted    bool           `db:"is_deleted"`
	DeletedAt    sql.NullTime   `db:"deleted_at"`
}

func (ds *dbSubcategory) ToEntity() *domain.Subcategory {
	var (
		updatedAt, deletedAt *time.Time
		userID               *int
		userName             *string
		i                    int
		categoryName         *string
	)
	if ds.UpdatedAt.Valid {
		updatedAt = parseNullableTime(ds.UpdatedAt)
	}
	if ds.DeletedAt.Valid {
		t := ds.DeletedAt.Time
		deletedAt = &t
	}
	if ds.UserID.Valid {
		i = int(ds.UserID.Int64)
		userID = &i
	}
	if ds.UserName.Valid {
		value := ds.UserName.String
		userName = &value
	}
	if ds.CategoryName.Valid {
		value := ds.CategoryName.String
		categoryName = &value
	}
	return &domain.Subcategory{
		ID:           ds.ID,
		CategoryID:   ds.CategoryID,
		Name:         ds.Name,
		CategoryName: categoryName,
		CreatedAt:    parseTime(ds.CreatedAt),
		UpdatedAt:    updatedAt,
		UserID:       userID,
		UserName:     userName,
		IsDeleted:    ds.IsDeleted,
		DeletedAt:    deletedAt,
	}
}

type dbMerchant struct {
	ID           int            `db:"id"`
	UserID       int            `db:"user_id"`
	UserName     sql.NullString `db:"user_name"`
	Name         string         `db:"merchant_name"`
	CategoryID   int            `db:"category_id"`
	CategoryName sql.NullString `db:"category_name"`
	CreatedAt    string         `db:"created_at"`
	UpdatedAt    sql.NullString `db:"updated_at"`
	IsDeleted    bool           `db:"is_deleted"`
	DeletedAt    sql.NullTime   `db:"deleted_at"`
}

func (dm *dbMerchant) ToEntity() *domain.Merchant {
	var (
		updatedAt, deletedAt *time.Time
		userName             *string
		categoryName         *string
	)
	if dm.UpdatedAt.Valid {
		updatedAt = parseNullableTime(dm.UpdatedAt)
	}
	if dm.DeletedAt.Valid {
		t := dm.DeletedAt.Time
		deletedAt = &t
	}
	if dm.UserName.Valid {
		value := dm.UserName.String
		userName = &value
	}
	if dm.CategoryName.Valid {
		value := dm.CategoryName.String
		categoryName = &value
	}
	return &domain.Merchant{
		ID:           dm.ID,
		UserID:       dm.UserID,
		Name:         dm.Name,
		CategoryID:   dm.CategoryID,
		CategoryName: categoryName,
		UserName:     userName,
		CreatedAt:    parseTime(dm.CreatedAt),
		UpdatedAt:    updatedAt,
		IsDeleted:    dm.IsDeleted,
		DeletedAt:    deletedAt,
	}

}

type dbTag struct {
	ID        int            `db:"id"`
	UserID    int            `db:"user_id"`
	UserName  sql.NullString `db:"user_name"`
	Name      string         `db:"tag_name"`
	CreatedAt string         `db:"created_at"`
	UpdatedAt sql.NullString `db:"updated_at"`
	IsDeleted bool           `db:"is_deleted"`
	DeletedAt sql.NullTime   `db:"deleted_at"`
}

func (dt *dbTag) ToEntity() *domain.Tag {
	var (
		updatedAt, deletedAt *time.Time
		userName             *string
	)
	if dt.UpdatedAt.Valid {
		updatedAt = parseNullableTime(dt.UpdatedAt)
	}
	if dt.DeletedAt.Valid {
		t := dt.DeletedAt.Time
		deletedAt = &t
	}
	if dt.UserName.Valid {
		value := dt.UserName.String
		userName = &value
	}
	return &domain.Tag{
		ID:        dt.ID,
		UserID:    dt.UserID,
		UserName:  userName,
		Name:      dt.Name,
		CreatedAt: parseTime(dt.CreatedAt),
		UpdatedAt: updatedAt,
		IsDeleted: dt.IsDeleted,
		DeletedAt: deletedAt,
	}

}

type dbTransaction struct {
	ID              int            `db:"id"`
	UserID          int            `db:"user_id"`
	UserName        sql.NullString `db:"user_name"`
	AccountID       int            `db:"account_id"`
	AccountName     sql.NullString `db:"account_name"`
	CategoryID      int            `db:"category_id"`
	CategoryName    sql.NullString `db:"category_name"`
	SubcategoryID   sql.NullInt64  `db:"subcategory_id"`
	SubcategoryName sql.NullString `db:"subcategory_name"`
	MerchantID      sql.NullInt64  `db:"merchant_id"`
	MerchantName    sql.NullString `db:"merchant_name"`
	Tags            []string       `db:"tags"`
	Type            string         `db:"transaction_type"`
	Amount          float64        `db:"amount"`
	Recipient       sql.NullString `db:"recipient"`
	Comment         sql.NullString `db:"comment"`
	CreatedAt       string         `db:"created_at"`
	UpdatedAt       sql.NullString `db:"updated_at"`
	RecurringID     sql.NullInt64  `db:"recurring_id"`
	TransferID      sql.NullInt64  `db:"transfer_id"`
	IsDeleted       bool           `db:"is_deleted"`
	DeletedAt       sql.NullTime   `db:"deleted_at"`
}

func (dtr *dbTransaction) ToEntity() *domain.Transactions {
	var (
		updatedAt, deletedAt                               *time.Time
		subcategoryID, merchantID, reccuringID, transferID *int
		recipient, comment                                 *string
		userName, accountName, categoryName                *string
		subcategoryName, merchantName                      *string
		i                                                  int
	)
	if dtr.UpdatedAt.Valid {
		updatedAt = parseNullableTime(dtr.UpdatedAt)
	}
	if dtr.DeletedAt.Valid {
		t := dtr.DeletedAt.Time
		deletedAt = &t
	}
	if dtr.SubcategoryID.Valid {
		i = int(dtr.SubcategoryID.Int64)
		subcategoryID = &i
	}
	if dtr.MerchantID.Valid {
		i = int(dtr.MerchantID.Int64)
		merchantID = &i
	}
	if dtr.RecurringID.Valid {
		i = int(dtr.RecurringID.Int64)
		reccuringID = &i
	}
	if dtr.TransferID.Valid {
		i = int(dtr.TransferID.Int64)
		transferID = &i
	}
	if dtr.Recipient.Valid {
		value := dtr.Recipient.String
		recipient = &value
	}
	if dtr.Comment.Valid {
		value := dtr.Comment.String
		comment = &value
	}
	if dtr.UserName.Valid {
		value := dtr.UserName.String
		userName = &value
	}
	if dtr.AccountName.Valid {
		value := dtr.AccountName.String
		accountName = &value
	}
	if dtr.CategoryName.Valid {
		value := dtr.CategoryName.String
		categoryName = &value
	}
	if dtr.SubcategoryName.Valid {
		value := dtr.SubcategoryName.String
		subcategoryName = &value
	}
	if dtr.MerchantName.Valid {
		value := dtr.MerchantName.String
		merchantName = &value
	}
	return &domain.Transactions{
		ID:              dtr.ID,
		UserID:          dtr.UserID,
		UserName:        userName,
		AccountID:       dtr.AccountID,
		AccountName:     accountName,
		CategoryID:      dtr.CategoryID,
		CategoryName:    categoryName,
		SubcategoryID:   subcategoryID,
		SubcategoryName: subcategoryName,
		MerchantID:      merchantID,
		MerchantName:    merchantName,
		Tags:            dtr.Tags,
		Type:            dtr.Type,
		Amount:          dtr.Amount,
		Recipient:       recipient,
		Comment:         comment,
		CreatedAt:       parseTime(dtr.CreatedAt),
		UpdatedAt:       updatedAt,
		RecurringID:     reccuringID,
		TransferID:      transferID,
		IsDeleted:       dtr.IsDeleted,
		DeletedAt:       deletedAt,
	}
}

type dbTransferFull struct {
	ID              int            `db:"id"`
	UserName        string         `db:"user_name"`
	FromAccountName string         `db:"acc_from_name"`
	ToAccountName   string         `db:"acc_to_name"`
	Amount          float64        `db:"amount"`
	CreatedAt       string         `db:"created_at"`
	Comment         sql.NullString `db:"comment"`
}

func (dtf *dbTransferFull) ToEntity() *domain.TransferFull {
	var comment *string
	if dtf.Comment.Valid {
		s := dtf.Comment.String
		comment = &s
	}

	return &domain.TransferFull{
		ID:              dtf.ID,
		UserName:        dtf.UserName,
		FromAccountName: dtf.FromAccountName,
		ToAccountName:   dtf.ToAccountName,
		Amount:          dtf.Amount,
		CreatedAt:       parseTime(dtf.CreatedAt),
		Comment:         comment,
	}
}

type dbTransfer struct {
	ID              int            `db:"id"`
	UserID          int            `db:"user_id"`
	UserName        string         `db:"user_name"`
	FromAccountID   int            `db:"from_account_id"`
	ToAccountID     int            `db:"to_account_id"`
	FromAccountName string         `db:"acc_from_name"`
	ToAccountName   string         `db:"acc_to_name"`
	Amount          float64        `db:"amount"`
	CreatedAt       string         `db:"created_at"`
	Comment         sql.NullString `db:"comment"`
}

func (dt *dbTransfer) ToEntity() *domain.Transfer {
	var comment *string
	if dt.Comment.Valid {
		s := dt.Comment.String
		comment = &s
	}

	return &domain.Transfer{
		ID:              dt.ID,
		UserID:          dt.UserID,
		UserName:        dt.UserName,
		FromAccountID:   dt.FromAccountID,
		ToAccountID:     dt.ToAccountID,
		FromAccountName: dt.FromAccountName,
		ToAccountName:   dt.ToAccountName,
		Amount:          dt.Amount,
		CreatedAt:       parseTime(dt.CreatedAt),
		Comment:         comment,
	}
}

type dbRecTransaction struct {
	ID         int          `db:"id"`
	UserName   string       `db:"user_name"`
	PeriodType string       `db:"period_type"`
	Interval   int          `db:"interval"`
	DayOfMonth sql.NullByte `db:"day_of_month"`
	DayOfWeek  sql.NullByte `db:"day_of_week"`
	StartDate  time.Time    `db:"start_date"`
	EndDate    sql.NullTime `db:"end_date"`
	NextRunAt  time.Time    `db:"next_run_at"`
	Status     string       `db:"status"`
}

func (drt *dbRecTransaction) ToEntity() *domain.RecTransaction {
	var dayOfMonth, dayOfWeek *int8
	if drt.DayOfMonth.Valid {
		i := int8(drt.DayOfMonth.Byte)
		dayOfMonth = &i
	}
	if drt.DayOfWeek.Valid {
		i := int8(drt.DayOfWeek.Byte)
		dayOfWeek = &i
	}
	return &domain.RecTransaction{
		ID:         drt.ID,
		UserName:   drt.UserName,
		PeriodType: drt.PeriodType,
		Interval:   drt.Interval,
		DayOfMonth: dayOfMonth,
		DayOfWeek:  dayOfWeek,
		StartDate:  parseDate(drt.StartDate.Format("2006-01-02")),
		EndDate:    parseNullableDate(drt.EndDate),
		NextRunAt:  parseTime(drt.NextRunAt.Format(dbTimeLayout)),
		Status:     drt.Status,
	}
}

type dbRecTransactionFull struct {
	ID              int            `db:"id"`
	UserID          int            `db:"user_id"`
	UserName        sql.NullString `db:"user_name"`
	AccountID       int            `db:"account_id"`
	AccountName     sql.NullString `db:"account_name"`
	CategoryID      int            `db:"category_id"`
	CategoryName    sql.NullString `db:"category_name"`
	SubcategoryID   sql.NullInt64  `db:"subcategory_id"`
	SubcategoryName sql.NullString `db:"subcategory_name"`
	MerchantID      sql.NullInt64  `db:"merchant_id"`
	MerchantName    sql.NullString `db:"merchant_name"`
	TagIDs          []int          `db:"tag_ids"`
	Tags            []string       `db:"tags"`
	Type            string         `db:"rec_transac_type"`
	Amount          float64        `db:"amount"`
	Recipient       sql.NullString `db:"recipient"`
	Comment         sql.NullString `db:"comment"`
	PeriodType      string         `db:"period_type"`
	Interval        int            `db:"interval"`
	DayOfMonth      sql.NullByte   `db:"day_of_month"`
	DayOfWeek       sql.NullByte   `db:"day_of_week"`
	StartDate       time.Time      `db:"start_date"`
	EndDate         sql.NullTime   `db:"end_date"`
	NextRunAt       string         `db:"next_run_at"`
	Timezone        string         `db:"timezone"`
	Status          string         `db:"status"`
	CreatedAt       string         `db:"created_at"`
	UpdatedAt       sql.NullString `db:"updated_at"`
}

func (drtf *dbRecTransactionFull) ToEntity() *domain.RecTransactionFull {
	var (
		dayOfMonth, dayOfWeek     *int8
		subcategoryID, merchantID *int
		userName, accountName, categoryName, subcategoryName,
		merchantName, recipient, comment *string
	)
	if drtf.DayOfMonth.Valid {
		i := int8(drtf.DayOfMonth.Byte)
		dayOfMonth = &i
	}
	if drtf.DayOfWeek.Valid {
		i := int8(drtf.DayOfWeek.Byte)
		dayOfWeek = &i
	}
	if drtf.UserName.Valid {
		s := drtf.UserName.String
		userName = &s
	}
	if drtf.AccountName.Valid {
		s := drtf.AccountName.String
		accountName = &s
	}
	if drtf.CategoryName.Valid {
		s := drtf.CategoryName.String
		categoryName = &s
	}
	if drtf.SubcategoryID.Valid {
		i := int(drtf.SubcategoryID.Int64)
		subcategoryID = &i
	}
	if drtf.SubcategoryName.Valid {
		s := drtf.SubcategoryName.String
		subcategoryName = &s
	}
	if drtf.MerchantID.Valid {
		i := int(drtf.MerchantID.Int64)
		merchantID = &i
	}
	if drtf.MerchantName.Valid {
		s := drtf.MerchantName.String
		merchantName = &s
	}
	if drtf.Recipient.Valid {
		s := drtf.Recipient.String
		recipient = &s
	}
	if drtf.Comment.Valid {
		s := drtf.Comment.String
		comment = &s
	}
	return &domain.RecTransactionFull{
		ID:              drtf.ID,
		UserID:          drtf.UserID,
		UserName:        userName,
		AccountID:       drtf.AccountID,
		AccountName:     accountName,
		CategoryID:      drtf.CategoryID,
		CategoryName:    categoryName,
		SubcategoryID:   subcategoryID,
		SubcategoryName: subcategoryName,
		MerchantID:      merchantID,
		MerchantName:    merchantName,
		Tags:            drtf.Tags,
		TagIDs:          drtf.TagIDs,
		Type:            drtf.Type,
		Amount:          drtf.Amount,
		Recipient:       recipient,
		Comment:         comment,
		PeriodType:      drtf.PeriodType,
		Interval:        drtf.Interval,
		DayOfMonth:      dayOfMonth,
		DayOfWeek:       dayOfWeek,
		StartDate:       parseDate(drtf.StartDate.Format("2006-01-02")),
		EndDate:         parseNullableDate(drtf.EndDate),
		NextRunAt:       parseTime(drtf.NextRunAt),
		Timezone:        drtf.Timezone,
		Status:          drtf.Status,
		CreatedAt:       parseTime(drtf.CreatedAt),
		UpdatedAt:       parseNullableTime(drtf.UpdatedAt),
	}
}

type dbBudget struct {
	ID          int            `db:"id"`
	UserID      int            `db:"user_id"`
	Name        string         `db:"name"`
	PeriodType  string         `db:"period_type"`
	PeriodStart string         `db:"period_start"`
	PeriodEnd   string         `db:"period_end"`
	AmountLimit float64        `db:"amount_limit"`
	CategoryIDs []int          `db:"category_ids"`
	CreatedAt   string         `db:"created_at"`
	UpdatedAt   sql.NullString `db:"updated_at"`
	IsDeleted   bool           `db:"is_deleted"`
	DeletedAt   sql.NullTime   `db:"deleted_at"`
}

func (db *dbBudget) ToEntity() *domain.Budget {
	var updatedAt, deletedAt *time.Time
	if db.UpdatedAt.Valid {
		updatedAt = parseNullableTime(db.UpdatedAt)
	}
	if db.DeletedAt.Valid {
		t := db.DeletedAt.Time
		deletedAt = &t
	}
	return &domain.Budget{
		ID:          db.ID,
		UserID:      db.UserID,
		Name:        db.Name,
		PeriodType:  db.PeriodType,
		PeriodStart: parseDate(db.PeriodStart),
		PeriodEnd:   parseDate(db.PeriodEnd),
		AmountLimit: db.AmountLimit,
		CategoryIDs: db.CategoryIDs,
		CreatedAt:   parseTime(db.CreatedAt),
		UpdatedAt:   updatedAt,
		IsDeleted:   db.IsDeleted,
		DeletedAt:   deletedAt,
	}
}

type dbSavingGoal struct {
	ID            int            `db:"id"`
	UserID        int            `db:"user_id"`
	Name          string         `db:"name"`
	TargetAmount  float64        `db:"target_amount"`
	CurrentAmount float64        `db:"current_amount"`
	TargetDate    sql.NullTime   `db:"target_date"`
	Status        string         `db:"status"`
	Priority      sql.NullInt64  `db:"priority"`
	CreatedAt     string         `db:"created_at"`
	UpdatedAt     sql.NullString `db:"updated_at"`
}

func (db *dbSavingGoal) ToEntity() *domain.SavingGoal {
	var updatedAt *time.Time
	if db.UpdatedAt.Valid {
		updatedAt = parseNullableTime(db.UpdatedAt)
	}
	var targetDate *time.Time
	if db.TargetDate.Valid {
		t := db.TargetDate.Time
		targetDate = &t
	}
	var priority *int
	if db.Priority.Valid {
		i := int(db.Priority.Int64)
		priority = &i
	}
	return &domain.SavingGoal{
		ID:            db.ID,
		UserID:        db.UserID,
		Name:          db.Name,
		TargetAmount:  db.TargetAmount,
		CurrentAmount: db.CurrentAmount,
		TargetDate:    targetDate,
		Status:        db.Status,
		Priority:      priority,
		CreatedAt:     parseTime(db.CreatedAt),
		UpdatedAt:     updatedAt,
	}
}

type dbGoalContribution struct {
	ID            int    `db:"id"`
	GoalID        int    `db:"goal_id"`
	TransactionID int    `db:"transaction_id"`
	Amount        float64 `db:"amount"`
	CreatedAt     string `db:"created_at"`
}

func (db *dbGoalContribution) ToEntity() *domain.GoalContribution {
	return &domain.GoalContribution{
		ID:            db.ID,
		GoalID:        db.GoalID,
		TransactionID: db.TransactionID,
		Amount:        db.Amount,
		CreatedAt:     parseTime(db.CreatedAt),
	}
}

type dbUserEventLog struct {
	ID        int            `db:"id"`
	UserID    int            `db:"user_id"`
	EventType string         `db:"event_type"`
	Payload   []byte         `db:"playload"`
	CreatedAt string         `db:"created_at"`
	IPAddress sql.NullString `db:"ip_address"`
	UserAgent sql.NullString `db:"user_agent"`
}

func (db *dbUserEventLog) ToEntity() *domain.UserEventLog {
	var ipAddress, userAgent *string
	if db.IPAddress.Valid {
		s := db.IPAddress.String
		ipAddress = &s
	}
	if db.UserAgent.Valid {
		s := db.UserAgent.String
		userAgent = &s
	}
	return &domain.UserEventLog{
		ID:        db.ID,
		UserID:    db.UserID,
		EventType: db.EventType,
		Payload:   db.Payload,
		CreatedAt: parseTime(db.CreatedAt),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}
}

const dbTimeLayout = "2006-01-02 15:04:05"

func parseTime(value string) time.Time {
	t, err := time.Parse(dbTimeLayout, value)
	if err != nil {
		return time.Time{}
	}
	return t
}

func parseNullableTime(value sql.NullString) *time.Time {
	if !value.Valid {
		return nil
	}
	t, err := time.Parse(dbTimeLayout, value.String)
	if err != nil {
		return nil
	}
	return &t
}

const dbDateLayout = "2006-01-02"

func parseDate(value string) time.Time {
	t, err := time.Parse(dbDateLayout, value)
	if err != nil {
		return time.Time{}
	}
	return t
}

func parseNullableDate(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	t, err := time.Parse(dbTimeLayout, value.Time.Format(dbDateLayout))
	if err != nil {
		return nil
	}
	return &t
}
