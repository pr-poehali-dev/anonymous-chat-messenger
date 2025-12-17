import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def generate_anonymous_id() -> str:
    return str(secrets.randbelow(10000)).zfill(4)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Регистрация и авторизация анонимных пользователей
    Args: event - dict с httpMethod, body
          context - объект с request_id и другими атрибутами
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                password = body_data.get('password', '')
                if len(password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'}),
                        'isBase64Encoded': False
                    }
                
                anonymous_id = None
                for _ in range(10):
                    test_id = f'#{generate_anonymous_id()}'
                    cursor.execute("SELECT id FROM users WHERE anonymous_id = %s", (test_id,))
                    if not cursor.fetchone():
                        anonymous_id = test_id
                        break
                
                if not anonymous_id:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не удалось создать уникальный ID'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                cursor.execute(
                    "INSERT INTO users (anonymous_id, password_hash) VALUES (%s, %s) RETURNING id, anonymous_id, created_at",
                    (anonymous_id, password_hash)
                )
                user = cursor.fetchone()
                
                session_token = generate_session_token()
                expires_at = datetime.now() + timedelta(days=30)
                cursor.execute(
                    "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                    (user['id'], session_token, expires_at)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user_id': user['id'],
                        'anonymous_id': user['anonymous_id'],
                        'session_token': session_token,
                        'created_at': user['created_at'].isoformat()
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                anonymous_id = body_data.get('anonymous_id', '')
                password = body_data.get('password', '')
                
                if not anonymous_id.startswith('#'):
                    anonymous_id = f'#{anonymous_id}'
                
                cursor.execute(
                    "SELECT id, anonymous_id, password_hash FROM users WHERE anonymous_id = %s",
                    (anonymous_id,)
                )
                user = cursor.fetchone()
                
                if not user or user['password_hash'] != hash_password(password):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный ID или пароль'}),
                        'isBase64Encoded': False
                    }
                
                session_token = generate_session_token()
                expires_at = datetime.now() + timedelta(days=30)
                cursor.execute(
                    "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                    (user['id'], session_token, expires_at)
                )
                
                cursor.execute(
                    "UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user_id': user['id'],
                        'anonymous_id': user['anonymous_id'],
                        'session_token': session_token
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            session_token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token')
            
            if not session_token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "SELECT s.user_id, u.anonymous_id, u.settings FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = %s AND s.expires_at > CURRENT_TIMESTAMP",
                (session_token,)
            )
            session_data = cursor.fetchone()
            
            if not session_data:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сессия недействительна'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user_id': session_data['user_id'],
                    'anonymous_id': session_data['anonymous_id'],
                    'settings': session_data['settings']
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
