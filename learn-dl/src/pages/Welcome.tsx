import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, User, AlertCircle } from 'lucide-react';

export function Welcome() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await register(username, email, password);

      if (result.success) {
        navigate('/training');
      } else {
        setError(result.error || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="size-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ML Training Platform</h1>
          <p className="text-gray-600">Train, predict, and manage your machine learning models</p>
        </div>

        {/* Auth Card */}
        

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Build and deploy machine learning models with ease
        </p>
      </div>
    </div>
  );
}
