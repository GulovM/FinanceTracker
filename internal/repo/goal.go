package repo

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateGoal(ctx context.Context, goal *domain.CreateGoal) (int, error) {
	query := `
	insert into saving_goal(user_id, name, target_amount, target_date, priority)
	values ($1, $2, $3, $4, $5)
	returning id;
	`

	var id int
	err := r.postgres.QueryRow(ctx, query,
		goal.UserID, goal.Name, goal.TargetAmount, goal.TargetDate, goal.Priority,
	).Scan(&id)
	if err != nil {
		return 0, exec_err(err)
	}
	return id, nil
}

func (r *Repository) GetGoals(ctx context.Context, userID int) ([]*domain.SavingGoal, error) {
	query := `
	select
		sg.id,
		sg.user_id,
		sg.name,
		sg.target_amount,
		COALESCE(sum(gc.amount), 0) current_amount,
		sg.target_date,
		sg.status::text,
		sg.priority,
		to_char(sg.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		to_char(sg.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
	from saving_goal sg
	left join goal_contribution gc on gc.goal_id = sg.id
	where sg.user_id = $1
	group by sg.id
	order by sg.id desc;
	`

	rows, err := r.postgres.Query(ctx, query, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	defer rows.Close()

	var goals []*domain.SavingGoal
	for rows.Next() {
		g, err := pgx.RowToStructByName[dbSavingGoal](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		goals = append(goals, g.ToEntity())
	}
	return goals, nil
}

func (r *Repository) GetGoalByID(ctx context.Context, userID, id int) (*domain.SavingGoal, error) {
	query := `
	select
		sg.id,
		sg.user_id,
		sg.name,
		sg.target_amount,
		COALESCE(sum(gc.amount), 0) current_amount,
		sg.target_date,
		sg.status::text,
		sg.priority,
		to_char(sg.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		to_char(sg.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
	from saving_goal sg
	left join goal_contribution gc on gc.goal_id = sg.id
	where sg.id = $1 and sg.user_id = $2
	group by sg.id;
	`

	rows, err := r.postgres.Query(ctx, query, id, userID)
	if err != nil {
		return nil, scan_err(err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errs.ErrNotFound
	}

	g, err := pgx.RowToStructByName[dbSavingGoal](rows)
	if err != nil {
		return nil, scan_err(err)
	}
	return g.ToEntity(), nil
}

func (r *Repository) UpdateGoal(ctx context.Context, goal *domain.UpdateGoal) error {
	query := `
	update saving_goal set
		name = $1,
		target_amount = $2,
		target_date = $3,
		priority = $4,
		updated_at = now()
	where id = $5 and user_id = $6;
	`

	_, err := r.postgres.Exec(ctx, query,
		goal.Name, goal.TargetAmount, goal.TargetDate, goal.Priority,
		goal.ID, goal.UserID,
	)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) UpdateGoalStatus(ctx context.Context, userID, id int, status string) error {
	query := `
	update saving_goal set status = $1, updated_at = now()
	where id = $2 and user_id = $3;
	`

	_, err := r.postgres.Exec(ctx, query, status, id, userID)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) GetContributions(ctx context.Context, goalID int) ([]*domain.GoalContribution, error) {
	query := `
	select
		id,
		goal_id,
		transaction_id,
		amount,
		to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') created_at
	from goal_contribution
	where goal_id = $1
	order by id desc;
	`

	rows, err := r.postgres.Query(ctx, query, goalID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	defer rows.Close()

	var contributions []*domain.GoalContribution
	for rows.Next() {
		c, err := pgx.RowToStructByName[dbGoalContribution](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		contributions = append(contributions, c.ToEntity())
	}
	return contributions, nil
}

func (r *Repository) AddContribution(ctx context.Context, contribution *domain.CreateContribution) (int, error) {
	query := `
	insert into goal_contribution(goal_id, transaction_id, amount)
	values ($1, $2, $3)
	returning id;
	`

	var id int
	err := r.postgres.QueryRow(ctx, query,
		contribution.GoalID, contribution.TransactionID, contribution.Amount,
	).Scan(&id)
	if err != nil {
		return 0, exec_err(err)
	}
	return id, nil
}

func (r *Repository) DeleteContribution(ctx context.Context, id int) error {
	query := `delete from goal_contribution where id = $1;`

	_, err := r.postgres.Exec(ctx, query, id)
	if err != nil {
		return exec_err(err)
	}
	return nil
}
