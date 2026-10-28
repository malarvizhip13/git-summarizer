exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", {
    ifNotExists: true,
  });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },

    name: {
      type: "varchar(100)",
      notNull: false,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("repositories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },

    github_url: {
      type: "text",
      notNull: true,
    },

    github_owner: {
      type: "varchar(100)",
      notNull: true,
    },

    github_name: {
      type: "varchar(200)",
      notNull: true,
    },

    default_branch: {
      type: "varchar(100)",
      notNull: true,
      default: "main",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("analyses", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    repository_id: {
      type: "uuid",
      notNull: true,
      references: "repositories(id)",
      onDelete: "CASCADE",
    },

    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
    },

    commit_sha: {
      type: "varchar(64)",
      notNull: false,
    },

    summary: {
      type: "text",
      notNull: false,
    },

    analysis_result: {
      type: "jsonb",
      notNull: false,
    },

    error_message: {
      type: "text",
      notNull: false,
    },

    started_at: {
      type: "timestamptz",
      notNull: false,
    },

    completed_at: {
      type: "timestamptz",
      notNull: false,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("analyses", "analyses_status_check", {
    check: "status IN ('pending', 'running', 'completed', 'failed')",
  });

  pgm.addConstraint("repositories", "repositories_user_github_unique", {
    unique: ["user_id", "github_owner", "github_name"],
  });

  pgm.createIndex("repositories", "user_id");

  pgm.createIndex("repositories", [
    "github_owner",
    "github_name",
  ]);

  pgm.createIndex("analyses", "repository_id");

  pgm.createIndex("analyses", "status");

  pgm.createIndex("analyses", "created_at");
};

exports.down = (pgm) => {
  pgm.dropTable("analyses");
  pgm.dropTable("repositories");
  pgm.dropTable("users");
};