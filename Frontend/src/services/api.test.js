import { checkApiHealth } from "./api";

checkApiHealth()
  .then((data) => {
    console.log("Backend connection successful:", data);
  })
  .catch((error) => {
    console.error("Backend connection failed:", error.message);
  });