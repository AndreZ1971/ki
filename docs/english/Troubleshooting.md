# Troubleshooting – AI Agent Business Platform

Here you will find quick help for common problems and malfunctions related to the AI Agent Platform.

---

## Container does not start

- **Check if Docker and Docker Compose are installed.**
- **Are all ports free?** (Default: 5173 for frontend, 3000 for backend)
- **Error message in terminal?** Show logs with:
  
  
  ```bash
  docker compose logs
  ```
  
- **Enough storage/resources available?**

---

## Frontend does not load / is not reachable

- **Is the container started?**
- **Call the URL in your browser:** `http://localhost:5173`
- **Clear browser cache**
- **Check logs:**
  
  
  ```bash
  docker compose logs frontend
  ```
  

---

## Backend/API does not work

- **Backend container running?**
- **API URL correct in settings UI?**
- **Check logs:**
  
  
  ```bash
  docker compose logs backend
  ```
  
- **connection.json filled out correctly?**

---

## Connection to external services (OpenAI, Shop, Email) fails

- **API keys and credentials in `connection.json` correct?**
- **Internet connection available?**
- **Error message in log?**
- **Rate limits or access restrictions?**

---

## Settings cannot be saved / Import does not work

- **Check file format of `connection.json` (UTF-8, valid structure)**
- **Import function in settings UI used correctly?**
- **Check browser console for errors**

### 400 Bad Request when saving settings

- Check if within a group (WordPress, WooCommerce, OpenAI) only some fields were filled. Either fill out completely correctly – or leave group empty.
- If `Job Mode = Interval`: `Job Interval (ms)` must be between 10,000 and 86,400,000 (10s–24h). For `one-time`, the interval is ignored.
- Backend logs show exact hints for field and rule:
  
  ```bash
  docker compose logs backend | grep "Validation failed"
  ```
  
  or check full log:
  
  ```bash
  docker compose logs -f backend
  ```

---

## System reacts slowly or hangs

- **Enough resources (CPU/RAM) available?**
- **Too many parallel jobs or users?**
- **Check logs for errors or warnings**
- **Restart containers:**
  
  
  ```bash
  docker compose restart
  ```
  

---

## Error persists / nothing helps

- **Collect all logs and send to support**
- **Note exact error description**
- **Use support contact in frontend or via email**

---

Last updated: December 2025
