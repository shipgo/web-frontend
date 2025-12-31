import Axios from "axios";

export const restclient = Axios.create({
  withCredentials: true,
  baseURL: "http://localhost:8080/api",
  headers: {
    Authorization: `Bearer eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJzaGlwZ28iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc1MzU3MDY1NiwiZXhwIjoxNzUzNTg1MDU2fQ.vwPG3LYBqvm9DJZqZ696Gskya8URm7ymmDv6SSOT_jf7WIkx-9gCQyemoEr3KaU7BgkjdB2OYQsaCMmt0xPt9Q`,
  },
});
