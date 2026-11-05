exports.shorthands = undefined;

const publicUserId = "00000000-0000-4000-8000-000000000001";

exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO users (id, email, name)
    VALUES ('${publicUserId}', 'public@gitsummarizer.local', 'Public')
    ON CONFLICT (id) DO NOTHING;
  `);

  pgm.dropTable("auth_sessions", { ifExists: true });
  pgm.dropConstraint("users", "users_provider_subject_unique", {
    ifExists: true,
  });
  pgm.dropColumns(
    "users",
    ["oauth_provider", "oauth_subject", "provider_name", "avatar_url"],
    { ifExists: true }
  );
};

exports.down = (pgm) => {
  pgm.addColumns("users", {
    oauth_provider: { type: "varchar(30)" },
    oauth_subject: { type: "varchar(255)" },
    provider_name: { type: "varchar(100)" },
    avatar_url: { type: "text" },
  });
  pgm.addConstraint("users", "users_provider_subject_unique", {
    unique: ["oauth_provider", "oauth_subject"],
  });
  pgm.createTable("auth_sessions", {
    token_hash: { type: "char(64)", primaryKey: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("auth_sessions", "user_id");
  pgm.createIndex("auth_sessions", "expires_at");
};
