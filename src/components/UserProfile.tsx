import React, { useState, useEffect } from 'react';
import { 
  User, LogOut, Mail, Phone, Building2, MapPin, Save, X, Edit3,
  ShieldCheck, Sparkles, Calendar, CreditCard
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

interface UserProfileProps {
  user: any;
  onLogout: () => void;
  isSubscribed?: boolean | null;
}

interface ProfileData {
  fullName: string;
  phoneNumber: string;
  companyName: string;
  businessAddress: string;
}

interface SubscriptionDetails {
  plan: string;
  status: string;
  amount: number;
  autoRenew: boolean;
  subscriptionType: string;
  nextBillingDate: number | null;
  paymentMethod: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, isSubscribed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.displayName || '',
    phoneNumber: '',
    companyName: '',
    businessAddress: '',
  });
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            fullName: data.fullName || user.displayName || '',
            phoneNumber: data.phoneNumber || '',
            companyName: data.companyName || '',
            businessAddress: data.businessAddress || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.uid || !isSubscribed) return;
      try {
        const subRef = doc(db, 'subscriptions', user.uid);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          const data = subSnap.data();
          setSubDetails({
            plan: data.plan || 'pro',
            status: data.status || 'active',
            amount: data.amount || 90,
            autoRenew: data.autoRenew !== false,
            subscriptionType: data.subscriptionType || 'automatic',
            nextBillingDate: data.nextBillingDate || null,
            paymentMethod: data.paymentMethod || 'gpay'
          });
        } else {
          // Fallback default automatic subscription if user isSubscribed but no subscription doc yet
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          setSubDetails({
            plan: 'pro',
            status: 'active',
            amount: 90,
            autoRenew: true,
            subscriptionType: 'automatic',
            nextBillingDate: nextBilling.getTime(),
            paymentMethod: 'gpay'
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [user, isSubscribed]);

  if (!user) return null;

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      // 1. Update Firebase Auth Profile (for displayName)
      await updateProfile(auth.currentUser, {
        displayName: profileData.fullName,
      });

      // 2. Update Firestore Doc
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(docRef, {
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        companyName: profileData.companyName,
        businessAddress: profileData.businessAddress,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to current auth user name at least
    setProfileData(prev => ({
      ...prev,
      fullName: auth.currentUser?.displayName || '',
    }));
    // Re-fetch from firestore to be sure
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            fullName: data.fullName || user.displayName || '',
            phoneNumber: data.phoneNumber || '',
            companyName: data.companyName || '',
            businessAddress: data.businessAddress || '',
          });
        }
      } catch (error) {}
    };
    fetchProfile();
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        {/* Header/Banner Area */}
        <div className="relative h-32 bg-linear-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-16 mb-8 gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-lg">
                <div className="w-full h-full bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
                {profileData.fullName || user.displayName || 'User'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                {profileData.phoneNumber && (
                  <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {profileData.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold rounded-xl transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : null}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Stats/Info */}
            <div className="lg:col-span-1 space-y-6">
              {isSubscribed && (
                <div className={`p-6 bg-gradient-to-br ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'from-amber-500/10 via-amber-600/5' : 'from-emerald-500/10 via-emerald-600/5'} to-transparent rounded-2xl ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'border border-amber-500/30' : 'border border-emerald-500/20'} shadow-xs animate-fadeIn`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <h3 className={`text-sm font-bold ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'} uppercase tracking-wider`}>
                      {user?.email === 'dharmvir1000.dd@gmail.com' ? 'Lifetime VIP Member' : 'Pro Subscription'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Billing Plan</p>
                      <p className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className={`w-4 h-4 ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'text-amber-500' : 'text-emerald-500'}`} />
                        {user?.email === 'dharmvir1000.dd@gmail.com' ? 'Lifetime Free Pro' : 'Pro Plan Monthly'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Recurring Amount</p>
                      <p className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-1.5">
                        <CreditCard className={`w-4 h-4 ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'text-amber-500' : 'text-emerald-500'}`} />
                        {user?.email === 'dharmvir1000.dd@gmail.com' ? '₹0.00 / Lifetime Free' : '₹90.00 / month'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Renewal Process</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${user?.email === 'dharmvir1000.dd@gmail.com' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'}`}>
                        {user?.email === 'dharmvir1000.dd@gmail.com' ? 'Active For Lifetime' : 'Automatic Auto-Debit Enabled'}
                      </span>
                    </div>

                    {user?.email === 'dharmvir1000.dd@gmail.com' ? (
                      <div className="pt-2 border-t border-amber-500/15">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          Expiration Status
                        </p>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          Never Expires (Free Forever)
                        </p>
                      </div>
                    ) : (
                      subDetails?.nextBillingDate && (
                        <div className="pt-2 border-t border-emerald-500/15">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            Next Automatic Charge
                          </p>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {new Date(subDetails.nextBillingDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Account Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      {profileData.companyName || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="break-words">{profileData.businessAddress || 'Not specified'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Edit Section */}
            <div className="lg:col-span-2">
              <div className={`p-8 rounded-3xl border transition-all duration-300 ${isEditing ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 shadow-inner' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? 'Modify Profile' : 'Business Information'}
                  </h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditing || loading}
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden transition-all disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input
                      type="tel"
                      disabled={!isEditing || loading}
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      placeholder="+91 00000 00000"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden transition-all disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                    <input
                      type="text"
                      disabled={!isEditing || loading}
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      placeholder="Business or Company Name"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden transition-all disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Address</label>
                    <textarea
                      rows={3}
                      disabled={!isEditing || loading}
                      value={profileData.businessAddress}
                      onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden transition-all disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-900 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
