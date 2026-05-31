package auth

import (
	"Project/internal/errs"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
	secretKey []byte
	tokenTTL  time.Duration
}

type Claims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

func NewJWTManager(secret string, ttl time.Duration) *JWTManager {
	return &JWTManager{
		secretKey: []byte(secret),
		tokenTTL:  ttl,
	}
}

func (m *JWTManager) Generate(userID int) (string, error) {
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secretKey)
}

func (m *JWTManager) Parse(tokenStr string) (int, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errs.ErrExpOrInvToken
		}
		return m.secretKey, nil
	})

	if err != nil {
		return 0, errs.ErrExpOrInvToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return 0, errs.ErrExpOrInvToken
	}

	return claims.UserID, nil
}
