# API Specification for Brand Content System

## Overview
This document describes the REST API for the Brand Content System. The API enables various functionalities such as authentication, brand management, template synchronization, SVG library management, content generation, and workspace management.

## Authentication
### Endpoint: `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**  
  - **200 OK**:
    ```json
    {
      "token": "string",
      "expiresIn": "number"
    }
    ```
  - **401 Unauthorized**:
    ```json
    {
      "error": "Invalid credentials"
    }
    ```

## Brand Management
### Endpoint: `GET /api/brands`
- **Response:**  
  - **200 OK**:
    ```json
    [{
      "id": "number",
      "name": "string",
      "status": "string"
    }]
    ```  

### Endpoint: `POST /api/brands`
- **Request Body:**
  ```json
  {
    "name": "string",
    "status": "string"
  }
  ```
- **Response:**  
  - **201 Created**:
    ```json
    {
      "id": "number",
      "name": "string",
      "status": "string"
    }
    ```  
  - **400 Bad Request**:
    ```json
    {
      "error": "Invalid brand data"
    }
    ```  

## Template Sync
### Endpoint: `POST /api/templates/sync`
- **Request Body:**
  ```json
  {
    "templates": [
      {
        "id": "number",
        "content": "string"
      }
    ]
  }
  ```
- **Response:**  
  - **200 OK**:
    ```json
    {
      "message": "Templates synced successfully"
    }
    ```

## SVG Library Management
### Endpoint: `GET /api/svg`
- **Response:**  
  - **200 OK**:
    ```json
    [{
      "id": "number",
      "svgPath": "string"
    }]
    ```  

## Content Generation
### Endpoint: `POST /api/content/generate`
- **Request Body:**
  ```json
  {
    "templateId": "number",
    "data": { }
  }
  ```
- **Response:**  
  - **200 OK**:
    ```json
    {
      "contentId": "number",
      "content": "string"
    }
    ```

## Workspace Management
### Endpoint: `GET /api/workspaces`
- **Response:**  
  - **200 OK**:
    ```json
    [{
      "id": "number",
      "name": "string"
    }]
    ```  
### Endpoint: `POST /api/workspaces`
- **Request Body:**
  ```json
  {
    "name": "string"
  }
  ```
- **Response:**  
  - **201 Created**:
    ```json
    {
      "id": "number",
      "name": "string"
    }
    ```  
  - **400 Bad Request**:
    ```json
    {
      "error": "Invalid workspace data"
    }
    ```  

## Error Codes
- **400 Bad Request**: Invalid request format or data.
- **401 Unauthorized**: Authentication failed, invalid credentials.
- **404 Not Found**: Resource not found.
- **500 Internal Server Error**: Unexpected server error.  

---
This API specification provides a comprehensive guide for developers integrating with the Brand Content System.