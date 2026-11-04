exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("users", {
    github_id: {
      type: "varchar(30)",
      unique: true,
    },
    github_login: {
      type: "varchar(100)",
    },
    avatar_url: {
      type: "text",
      notNull: false,
    },
  });

  pgm.addColumn("analyses", {
    source_analysis_id: {
      type: "uuid",
      references: "analyses(id)",
      onDelete: "SET NULL",
    },
  });
  pgm.addConstraint(
    "analyses",
    "analyses_source_repository_unique",
    {
      unique: ["source_analysis_id", "repository_id"],
    }
  );

  pgm.createTable("auth_sessions", {
    token_hash: {
      type: "char(64)",
      primaryKey: true,
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("auth_sessions", "user_id");
  pgm.createIndex("auth_sessions", "expires_at");
};

exports.down = (pgm) => {
  pgm.dropTable("auth_sessions");
  pgm.dropConstraint(
    "analyses",
    "analyses_source_repository_unique"
  );
  pgm.dropColumn("analyses", "source_analysis_id");
  pgm.dropColumns("users", ["github_id", "github_login", "avatar_url"]);
};
