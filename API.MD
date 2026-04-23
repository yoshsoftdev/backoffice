# DGOS Odoo 18 API Documentation

## 1. Base URL
```
https://api-backoffice.dgos.id/jsonrpc
```

## 2. Authentication
- **API Key**: `4ff1bf4a0583d1738e1c68eed5002ceb77c10037`
- **Database**: `DGOS`
- **Username**: `mizan@visibel.ai`
- **Password**: `Rahasia!@#$%6`

## 3. Authentication Request

### Authenticate and get User ID
```bash
curl -X POST https://api-backoffice.dgos.id/jsonrpc \
  -H "Content-Type: application/json" \
  -H "api-key: 4ff1bf4a0583d1738e1c68eed5002ceb77c10037" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["DGOS", "mizan@visibel.ai", "Rahasia!@#$%6", {}]
    },
    "id": 1
  }'
```

**Response**: Returns user ID (e.g., `9`)

## 4. Query Res Partner by x_linkedin_profile

### Search for partners with LinkedIn profile data
```bash
curl -X POST https://api-backoffice.dgos.id/jsonrpc \
  -H "Content-Type: application/json" \
  -H "api-key: 4ff1bf4a0583d1738e1c68eed5002ceb77c10037" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "object",
      "method": "execute_kw",
      "args": [
        "DGOS",
        9,
        "Rahasia!@#$%6",
        "res.partner",
        "search_read",
        [
          [["x_linkedin_profile", "=", "https://www.linkedin.com/in/cendy-novita-442a4aa8/"]]
        ],
        {
          "fields": ["name", "function", "city", "user_id", "comment"]
        }
      ]
    },
    "id": 3
  }'
```

**Response Example**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": [
    {
      "id": 111,
      "name": "Cendy Novita",
      "function": "Operations Manager",
      "city": false
    },
    {
      "id": 80,
      "name": "Romeo",
      "function": "Casual Leasing Assistant Manager",
      "city": false
    }
  ]
}
```

## 5. Query Activities/Lognotes by Partner ID

### Get all messages and notes for a specific partner
```bash
curl -X POST https://api-backoffice.dgos.id/jsonrpc \
  -H "Content-Type: application/json" \
  -H "api-key: 4ff1bf4a0583d1738e1c68eed5002ceb77c10037" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "object",
      "method": "execute_kw",
      "args": [
        "DGOS",
        9,
        "Rahasia!@#$%6",
        "mail.message",
        "search_read",
        [
          [["res_id", "=", 65], ["model", "=", "res.partner"]]
        ],
        {
          "fields": ["message_type", "subject", "body", "date", "author_id", "subtype_id"],
          "order": "date desc"
        }
      ]
    },
    "id": 4
  }'
```

**Response Example**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": [
    {
      "id": 251,
      "message_type": "comment",
      "subject": false,
      "body": "<p>hari ini saya sudah kontak, belum ada respon</p>",
      "date": "2026-04-23 08:06:39",
      "author_id": [3, "Administrator"],
      "subtype_id": [2, "Note"]
    },
    {
      "id": 193,
      "message_type": "notification",
      "subject": false,
      "body": "",
      "date": "2026-04-22 16:06:31",
      "author_id": [3, "Administrator"],
      "subtype_id": [2, "Note"]
    },
    {
      "id": 153,
      "message_type": "notification",
      "subject": false,
      "body": "<p>Contact created</p>",
      "date": "2026-04-22 14:25:12",
      "author_id": [3, "Administrator"],
      "subtype_id": [2, "Note"]
    }
  ]
}
```

## 6. Field Mapping
- **name**: Person's name
- **function**: Position/job title
- **city**: Location (city)
- **x_linkedin_profile**: LinkedIn profile URL
- **message_type**: Type of message (comment, notification, email)
- **body**: Message content (HTML format)
- **date**: Timestamp of the message
- **author_id**: Author information [id, name]
- **subtype_id**: Message subtype [id, name]

## 7. Notes
- The API uses Odoo 18 JSON-RPC protocol
- User ID after authentication is `9`
- The `city` field appears to be empty in current data
- Use `function` field for position/title information
- Activities and lognotes are stored in the `mail.message` model
- Use `res_id` and `model` to filter messages for specific records
