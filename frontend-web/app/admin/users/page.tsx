'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    _count?: {
        stores: number;
        orders: number;
    };
}

import AdminSidebar from '../../components/AdminSidebar';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        fullName: '',
        phone: '',
        role: '',
        isActive: true,
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'CUSTOMER',
    });
    const [createError, setCreateError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchUsers(token);
    }, [filter, router]);

    const fetchUsers = async (token: string) => {
        setLoading(true);
        try {
            const url = filter
                ? `http://localhost:3000/api/users?role=${filter}`
                : 'http://localhost:3000/api/users';
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditForm({
            fullName: user.fullName,
            phone: user.phone || '',
            role: user.role,
            isActive: user.isActive,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
            if (data.success) {
                setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
                setShowEditModal(false);
                setEditingUser(null);
            } else {
                alert(data.message || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('حدث خطأ في الاتصال');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(createForm),
            });
            const data = await response.json();
            if (data.success) {
                setShowCreateModal(false);
                setCreateForm({ fullName: '', email: '', password: '', phone: '', role: 'CUSTOMER' });
                fetchUsers(token!);
            } else {
                setCreateError(data.message || data.messageAr || 'فشل إنشاء المستخدم');
            }
        } catch (error) {
            setCreateError('حدث خطأ في الاتصال');
        }
    };

    const handleToggleActive = async (userId: string, currentStatus: boolean) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            const data = await response.json();
            if (data.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            ADMIN: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'مدير' },
            SELLER: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'بائع' },
            MANAGER: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'مدير متجر' },
            DRIVER: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'سائق' },
            CUSTOMER: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'زبون' },
        };
        const badge = badges[role] || badges.CUSTOMER;
        return <span className={`badge ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    };

    return (
        <div className="min-h-screen flex">
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">المستخدمون</h1>
                        <p className="text-gray-400">إدارة جميع مستخدمي المنصة</p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        + إضافة مستخدم
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('')}
                        className={`px-4 py-2 rounded-lg transition ${!filter ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilter('ADMIN')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'ADMIN' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        المديرون
                    </button>
                    <button
                        onClick={() => setFilter('SELLER')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'SELLER' ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        البائعون
                    </button>
                    <button
                        onClick={() => setFilter('DRIVER')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'DRIVER' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        السائقون
                    </button>
                    <button
                        onClick={() => setFilter('CUSTOMER')}
                        className={`px-4 py-2 rounded-lg transition ${filter === 'CUSTOMER' ? 'bg-gray-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        الزبائن
                    </button>
                </div>

                {/* Users Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>المستخدم</th>
                                    <th>الدور</th>
                                    <th>الهاتف</th>
                                    <th>الحالة</th>
                                    <th>تاريخ التسجيل</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{user.fullName}</p>
                                                    <p className="text-sm text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td className="text-gray-400">{user.phone || '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                                className={`badge cursor-pointer hover:opacity-80 ${user.isActive ? 'badge-success' : 'badge-error'}`}
                                            >
                                                {user.isActive ? 'نشط' : 'معطل'}
                                            </button>
                                        </td>
                                        <td className="text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString('ar-DZ')}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-blue-400 hover:text-blue-300 ml-2"
                                            >
                                                ✏️ تعديل
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4">
                        <h2 className="text-2xl font-bold text-white mb-6">تعديل بيانات المستخدم</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">الاسم الكامل</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">الدور</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="CUSTOMER">زبون</option>
                                    <option value="SELLER">بائع</option>
                                    <option value="DRIVER">سائق</option>
                                    <option value="MANAGER">مدير متجر</option>
                                    <option value="ADMIN">مدير</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editForm.isActive}
                                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <label htmlFor="isActive" className="text-white">حساب نشط</label>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={handleSaveEdit} className="btn-primary flex-1">
                                💾 حفظ التغييرات
                            </button>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                                className="btn-secondary flex-1"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4">
                        <h2 className="text-2xl font-bold text-white mb-6">إضافة مستخدم جديد</h2>
                        {createError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">الاسم الكامل</label>
                                <input
                                    type="text"
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">كلمة المرور</label>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    className="input-field"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">الدور</label>
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="CUSTOMER">زبون</option>
                                    <option value="SELLER">بائع</option>
                                    <option value="DRIVER">سائق</option>
                                    <option value="ADMIN">مدير</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="btn-primary flex-1">
                                    ✅ إنشاء الحساب
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                                    className="bg-white/5 text-gray-300 py-3 px-6 rounded-lg hover:bg-white/10 transition flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
