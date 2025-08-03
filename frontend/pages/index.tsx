import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { authAPI, todoAPI, User, Todo } from '../utils/api';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadUserData();
    loadTodos();
  }, [router]);

  const loadUserData = async () => {
    try {
      const userData = await authAPI.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      Cookies.remove('token');
      router.push('/login');
    }
  };

  const loadTodos = async () => {
    try {
      const todosData = await todoAPI.getTodos();
      setTodos(todosData);
    } catch (error: any) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      if (editingTodo) {
        // Update existing todo
        const updatedTodo = await todoAPI.updateTodo(editingTodo.id, formData);
        setTodos(todos.map(todo => todo.id === editingTodo.id ? updatedTodo : todo));
        setSuccess('Todo updated successfully');
        setEditingTodo(null);
      } else {
        // Create new todo
        const newTodo = await todoAPI.createTodo(formData);
        setTodos([newTodo, ...todos]);
        setSuccess('Todo created successfully! Email notification sent.');
      }

      setFormData({ title: '', description: '' });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save todo');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await todoAPI.updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
    } catch (error: any) {
      setError('Failed to update todo');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
    });
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setFormData({ title: '', description: '' });
  };

  const handleDelete = async (todoId: number) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      await todoAPI.deleteTodo(todoId);
      setTodos(todos.filter(todo => todo.id !== todoId));
      setSuccess('Todo deleted successfully');
    } catch (error: any) {
      setError('Failed to delete todo');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <div className="logo">Todo App</div>
          <div className="user-info">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-small">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="todos-container">
          <div className="todos-header">
            <h1 className="todos-title">My Todos</h1>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="todo-form">
            <div className="todo-form-row">
              <input
                type="text"
                name="title"
                placeholder="Todo title..."
                className="form-input"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="todo-form-row">
              <textarea
                name="description"
                placeholder="Description (optional)..."
                className="form-input"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="todo-form-row">
              <button type="submit" className="btn btn-primary">
                {editingTodo ? 'Update Todo' : 'Add Todo'}
              </button>
              {editingTodo && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {todos.length === 0 ? (
            <div className="empty-state">
              <h3>No todos yet</h3>
              <p>Create your first todo to get started!</p>
            </div>
          ) : (
            <div>
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                >
                  <div className="todo-header">
                    <div>
                      <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="todo-description">{todo.description}</p>
                      )}
                    </div>
                    <div className="todo-actions">
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        className={`btn btn-small ${
                          todo.completed ? 'btn-secondary' : 'btn-primary'
                        }`}
                      >
                        {todo.completed ? 'Undo' : 'Complete'}
                      </button>
                      <button
                        onClick={() => handleEdit(todo)}
                        className="btn btn-secondary btn-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="todo-meta">
                    Created: {formatDate(todo.created_at)}
                    {todo.updated_at !== todo.created_at && (
                      <span> • Updated: {formatDate(todo.updated_at)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}