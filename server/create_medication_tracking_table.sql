-- Create medication_tracking table
CREATE TABLE IF NOT EXISTS medication_tracking (
    id SERIAL PRIMARY KEY,
    medication_id INT NOT NULL REFERENCES medications(id),
    tracked_by INT NOT NULL REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('given', 'missed', 'pending')) NOT NULL DEFAULT 'pending',
    notes TEXT,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

