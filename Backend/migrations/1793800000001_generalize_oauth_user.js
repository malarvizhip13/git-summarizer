exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.renameColumn("users", "github_id", "oauth_subject");
  pgm.renameColumn("users", "github_login", "provider_name");
  pgm.addColumn("users", {
    oauth_provider: {
      type: "varchar(30)",
    },
  });
  pgm.dropConstraint("users", "users_github_id_key");
  pgm.addConstraint("users", "users_provider_subject_unique", {
    unique: ["oauth_provider", "oauth_subject"],
  });

  pgm.sql(`
    UPDATE users
    SET oauth_provider = 'github'
    WHERE oauth_subject IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.dropConstraint("users", "users_provider_subject_unique");
  pgm.addConstraint("users", "users_github_id_key", {
    unique: ["oauth_subject"],
  });
  pgm.renameColumn("users", "provider_name", "github_login");
  pgm.renameColumn("users", "oauth_subject", "github_id");
  pgm.dropColumn("users", "oauth_provider");
};
