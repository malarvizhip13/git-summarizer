const {
  analyzeRepository,
} = require("./src/analyzers/repositoryAnalyzer");

const files = [
  {
    path: "package.json",
    content: JSON.stringify({
      dependencies: {
        express: "^5.0.0",
        react: "^19.0.0",
        axios: "^1.0.0",
      },
    }),
  },
  {
    path: "src/server.js",
    content: 'const express = require("express"); const axios = require("axios");',
  },
  {
    path: "src/app.py",
    content: 'import pandas as pd\nimport numpy as np\nfrom sklearn.model_selection import train_test_split\nfrom fastapi import FastAPI',
  },
  {
    path: ".github/workflows/ci.yml",
    content: "name: CI",
  },
  {
    path: "Dockerfile",
    content: "FROM node:22",
  },
];

console.log(JSON.stringify(analyzeRepository(files), null, 2));
