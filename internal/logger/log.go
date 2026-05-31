package logger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/rs/zerolog"
)

const (
	logDir  = "logs"
	logFile = "app.log"
)

var (
	Log  zerolog.Logger
	once sync.Once
)

// Init configures zerolog to write both to stdout and a local file under logs/.
// Calling it multiple times returns the same logger instance.
func Init() zerolog.Logger {
	once.Do(func() {
		zerolog.TimeFieldFormat = time.RFC3339
		Log = newLogger()
	})
	return Log
}

func newLogger() zerolog.Logger {
	if err := os.MkdirAll(logDir, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "logger setup fallback (mkdir failed): %v\n", err)
		return zerolog.New(os.Stdout).With().Timestamp().Logger()
	}

	path := filepath.Join(logDir, logFile)
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "logger setup fallback (open failed): %v\n", err)
		return zerolog.New(os.Stdout).With().Timestamp().Logger()
	}

	consoleWriter := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: time.RFC3339,
	}

	mw := io.MultiWriter(consoleWriter, file)
	return zerolog.New(mw).With().Timestamp().Logger()
}
