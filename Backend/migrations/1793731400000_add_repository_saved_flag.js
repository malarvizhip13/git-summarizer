exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("repositories", {
    is_saved: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("repositories", "is_saved");
};
