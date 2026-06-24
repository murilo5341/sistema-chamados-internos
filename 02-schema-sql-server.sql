/*
  Sistema interno de chamados - SQL Server
  Script inicial de schema e carga dos setores padrao.
*/

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'helpdesk')
BEGIN
    EXEC('CREATE SCHEMA helpdesk');
END
GO

CREATE TABLE helpdesk.departments (
    department_id INT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(80) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_departments_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_departments_created_at DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_departments PRIMARY KEY (department_id),
    CONSTRAINT UQ_departments_name UNIQUE (name)
);
GO

CREATE TABLE helpdesk.users (
    user_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_users_user_id DEFAULT (NEWID()),
    department_id INT NOT NULL,
    full_name NVARCHAR(140) NOT NULL,
    email NVARCHAR(180) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT ('USER'),
    is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NULL,

    CONSTRAINT PK_users PRIMARY KEY (user_id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT FK_users_departments FOREIGN KEY (department_id)
        REFERENCES helpdesk.departments (department_id),
    CONSTRAINT CK_users_role CHECK (role IN ('ADMIN', 'USER'))
);
GO

CREATE TABLE helpdesk.tickets (
    ticket_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_tickets_ticket_id DEFAULT (NEWID()),
    ticket_number BIGINT IDENTITY(1,1) NOT NULL,
    created_by_user_id UNIQUEIDENTIFIER NOT NULL,
    origin_department_id INT NOT NULL,
    target_department_id INT NOT NULL,
    title NVARCHAR(180) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    urgency VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL CONSTRAINT DF_tickets_status DEFAULT ('NEW'),
    read_at DATETIME2(0) NULL,
    closed_at DATETIME2(0) NULL,
    resolution_description NVARCHAR(MAX) NULL,
    last_status_changed_by_user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_tickets_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NULL,

    CONSTRAINT PK_tickets PRIMARY KEY (ticket_id),
    CONSTRAINT UQ_tickets_ticket_number UNIQUE (ticket_number),
    CONSTRAINT FK_tickets_created_by_user FOREIGN KEY (created_by_user_id)
        REFERENCES helpdesk.users (user_id),
    CONSTRAINT FK_tickets_origin_department FOREIGN KEY (origin_department_id)
        REFERENCES helpdesk.departments (department_id),
    CONSTRAINT FK_tickets_target_department FOREIGN KEY (target_department_id)
        REFERENCES helpdesk.departments (department_id),
    CONSTRAINT FK_tickets_last_changed_by_user FOREIGN KEY (last_status_changed_by_user_id)
        REFERENCES helpdesk.users (user_id),
    CONSTRAINT CK_tickets_urgency CHECK (urgency IN ('LOW', 'MODERATE', 'HIGH', 'URGENT')),
    CONSTRAINT CK_tickets_status CHECK (status IN ('NEW', 'READ', 'PENDING', 'COMPLETED', 'NOT_APPLICABLE')),
    CONSTRAINT CK_tickets_different_departments CHECK (origin_department_id <> target_department_id),
    CONSTRAINT CK_tickets_completed_requires_resolution CHECK (
        status <> 'COMPLETED'
        OR (
            resolution_description IS NOT NULL
            AND LEN(LTRIM(RTRIM(resolution_description))) > 0
        )
    )
);
GO

CREATE TABLE helpdesk.ticket_status_history (
    history_id BIGINT IDENTITY(1,1) NOT NULL,
    ticket_id UNIQUEIDENTIFIER NOT NULL,
    changed_by_user_id UNIQUEIDENTIFIER NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    note NVARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ticket_status_history_created_at DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ticket_status_history PRIMARY KEY (history_id),
    CONSTRAINT FK_ticket_status_history_ticket FOREIGN KEY (ticket_id)
        REFERENCES helpdesk.tickets (ticket_id),
    CONSTRAINT FK_ticket_status_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES helpdesk.users (user_id),
    CONSTRAINT CK_ticket_status_history_from_status CHECK (
        from_status IS NULL OR from_status IN ('NEW', 'READ', 'PENDING', 'COMPLETED', 'NOT_APPLICABLE')
    ),
    CONSTRAINT CK_ticket_status_history_to_status CHECK (
        to_status IN ('NEW', 'READ', 'PENDING', 'COMPLETED', 'NOT_APPLICABLE')
    )
);
GO

CREATE TABLE helpdesk.ticket_attachments (
    attachment_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ticket_attachments_attachment_id DEFAULT (NEWID()),
    ticket_id UNIQUEIDENTIFIER NOT NULL,
    uploaded_by_user_id UNIQUEIDENTIFIER NOT NULL,
    original_file_name NVARCHAR(260) NOT NULL,
    stored_file_name NVARCHAR(260) NOT NULL,
    mime_type NVARCHAR(120) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path NVARCHAR(500) NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ticket_attachments_created_at DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_ticket_attachments PRIMARY KEY (attachment_id),
    CONSTRAINT FK_ticket_attachments_ticket FOREIGN KEY (ticket_id)
        REFERENCES helpdesk.tickets (ticket_id),
    CONSTRAINT FK_ticket_attachments_user FOREIGN KEY (uploaded_by_user_id)
        REFERENCES helpdesk.users (user_id),
    CONSTRAINT CK_ticket_attachments_file_size CHECK (file_size_bytes > 0)
);
GO

CREATE TABLE helpdesk.notifications (
    notification_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_notifications_notification_id DEFAULT (NEWID()),
    ticket_id UNIQUEIDENTIFIER NOT NULL,
    recipient_user_id UNIQUEIDENTIFIER NOT NULL,
    type VARCHAR(40) NOT NULL,
    title NVARCHAR(180) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT (0),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT (SYSUTCDATETIME()),
    read_at DATETIME2(0) NULL,

    CONSTRAINT PK_notifications PRIMARY KEY (notification_id),
    CONSTRAINT FK_notifications_ticket FOREIGN KEY (ticket_id)
        REFERENCES helpdesk.tickets (ticket_id),
    CONSTRAINT FK_notifications_recipient_user FOREIGN KEY (recipient_user_id)
        REFERENCES helpdesk.users (user_id),
    CONSTRAINT CK_notifications_type CHECK (
        type IN ('TICKET_READ', 'TICKET_PENDING', 'TICKET_COMPLETED', 'TICKET_NOT_APPLICABLE')
    )
);
GO

CREATE INDEX IX_users_department_id
    ON helpdesk.users (department_id);
GO

CREATE INDEX IX_tickets_target_department_status_created_at
    ON helpdesk.tickets (target_department_id, status, created_at DESC);
GO

CREATE INDEX IX_tickets_created_by_user_created_at
    ON helpdesk.tickets (created_by_user_id, created_at DESC);
GO

CREATE INDEX IX_tickets_urgency_status
    ON helpdesk.tickets (urgency, status);
GO

CREATE INDEX IX_ticket_status_history_ticket_created_at
    ON helpdesk.ticket_status_history (ticket_id, created_at DESC);
GO

CREATE INDEX IX_notifications_recipient_read_created_at
    ON helpdesk.notifications (recipient_user_id, is_read, created_at DESC);
GO

INSERT INTO helpdesk.departments (name)
SELECT v.name
FROM (VALUES
    (N'TI'),
    (N'RH'),
    (N'Compras'),
    (N'Financeiro'),
    (N'Faturamento'),
    (N'Marketing'),
    (N'Producao')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1
    FROM helpdesk.departments d
    WHERE d.name = v.name
);
GO
