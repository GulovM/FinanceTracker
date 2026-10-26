package repo

import (
	"Project/internal/domain"
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateEvent(ctx context.Context, event *domain.CreateEvent) error {
	query := `
	insert into user_event_log(user_id, event_type, playload, ip_address, user_agent)
	values ($1, $2, $3, $4, $5);
	`

	_, err := r.postgres.Exec(ctx, query,
		event.UserID, event.EventType, event.Payload, event.IPAddress, event.UserAgent,
	)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) GetEvents(ctx context.Context, f *domain.EventFilter) ([]*domain.UserEventLog, error) {
	base := `
	select
		id,
		user_id,
		event_type,
		playload,
		to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		ip_address,
		user_agent
	from user_event_log
	`

	where := []string{"user_id = $1"}
	args := []interface{}{f.UserID}
	argIdx := 2

	if f.EventType != nil {
		where = append(where, fmt.Sprintf("event_type = $%d", argIdx))
		args = append(args, *f.EventType)
		argIdx++
	}

	if f.DateFrom != nil {
		where = append(where, fmt.Sprintf("created_at >= $%d", argIdx))
		args = append(args, *f.DateFrom)
		argIdx++
	}

	if f.DateTo != nil {
		where = append(where, fmt.Sprintf("created_at < $%d", argIdx))
		args = append(args, *f.DateTo)
		argIdx++
	}

	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}

	query := base +
		`where ` + strings.Join(where, " and ") +
		fmt.Sprintf(" order by created_at desc limit $%d offset $%d", argIdx, argIdx+1)

	args = append(args, f.Limit, f.Offset)

	rows, err := r.postgres.Query(ctx, query, args...)
	if err != nil {
		return nil, scan_err(err)
	}
	defer rows.Close()

	var events []*domain.UserEventLog
	for rows.Next() {
		e, err := pgx.RowToStructByName[dbUserEventLog](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		events = append(events, e.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return events, nil
}
