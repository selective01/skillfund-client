import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, Plus, Trash2, Save } from "lucide-react";
import Layout from "../../components/layout/Layout";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

const SKILL_CATEGORIES = [
  { value: "fashion", label: "Fashion & Tailoring" },
  { value: "carpentry", label: "Carpentry & Woodwork" },
  { value: "farming", label: "Farming & Agriculture" },
  { value: "photography", label: "Photography & Video" },
  { value: "baking", label: "Baking & Pastry" },
  { value: "mechanics", label: "Mechanics & Auto" },
  { value: "technology", label: "Technology & IT" },
  { value: "hair", label: "Hair & Beauty" },
  { value: "artisan", label: "Artisan & Crafts" },
  { value: "other", label: "Other" },
];

const INDUSTRIES = [
  "fashion", "carpentry", "farming", "photography",
  "baking", "mechanics", "technology", "hair", "artisan", "other"
];

const PORTFOLIO_LIMITS = { basic: 2, starter: 5, pro: 20, elite: "∞" };

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    bio: "",
    location: "",
    skill: "",
    skillCategory: "other",
    fundingGoal: "",
    fundingPurpose: "",
    projectedMonthlyIncome: "",
    profitSharePercentage: "",
    profitShareDuration: "",
    isAcceptingInvestments: true,
    investmentBudget: "",
    industriesOfInterest: [],
    preferredROI: "",
    riskTolerance: "medium",
    preferredDuration: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      linkedin: "",
      website: "",
    },
  });

  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioPreview, setPortfolioPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profiles/me");
      const p = res.data.profile;
      setProfile(p);
      setForm({
        bio: p.bio || "",
        location: p.location || "",
        skill: p.skill || "",
        skillCategory: p.skillCategory || "other",
        fundingGoal: p.fundingGoal || "",
        fundingPurpose: p.fundingPurpose || "",
        projectedMonthlyIncome: p.projectedMonthlyIncome || "",
        profitSharePercentage: p.profitSharePercentage || "",
        profitShareDuration: p.profitShareDuration || "",
        isAcceptingInvestments: p.isAcceptingInvestments ?? true,
        investmentBudget: p.investmentBudget || "",
        industriesOfInterest: p.industriesOfInterest || [],
        preferredROI: p.preferredROI || "",
        riskTolerance: p.riskTolerance || "medium",
        preferredDuration: p.preferredDuration || "",
        socialLinks: p.socialLinks || {
          instagram: "",
          twitter: "",
          linkedin: "",
          website: "",
        },
      });
    } catch (error) {
      // Profile doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("socialLinks.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const toggleIndustry = (industry) => {
    setForm((prev) => ({
      ...prev,
      industriesOfInterest: prev.industriesOfInterest.includes(industry)
        ? prev.industriesOfInterest.filter((i) => i !== industry)
        : [...prev.industriesOfInterest, industry],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/profiles/me", form);
      setProfile(res.data.profile);
      toast.success("Profile saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortfolioFile(file);
      setPortfolioPreview(URL.createObjectURL(file));
    }
  };

  const handlePortfolioUpload = async () => {
    if (!portfolioFile || !portfolioTitle) {
      toast.error("Please provide a title and image");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", portfolioFile);
      formData.append("title", portfolioTitle);
      formData.append("description", portfolioDescription);

      const res = await api.post("/profiles/portfolio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile((prev) => ({ ...prev, portfolio: res.data.portfolio }));
      setPortfolioTitle("");
      setPortfolioDescription("");
      setPortfolioFile(null);
      setPortfolioPreview(null);
      toast.success("Portfolio item uploaded!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolio = async (itemId) => {
    if (!window.confirm("Delete this portfolio item?")) return;
    try {
      const res = await api.delete(`/profiles/portfolio/${itemId}`);
      setProfile((prev) => ({ ...prev, portfolio: res.data.portfolio }));
      toast.success("Portfolio item deleted");
    } catch (error) {
      toast.error("Failed to delete portfolio item");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    toast.loading("Uploading avatar...");
    try {
        const res = await api.put("/profiles/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        });

        // Update profile state
        setProfile((prev) => ({ ...prev, avatar: res.data.avatar }));

        // Update user in store so sidebar avatar updates too
        updateUser({ ...user, avatar: res.data.avatar });

        toast.dismiss();
        toast.success("Avatar updated!");
    } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Avatar upload failed");
    }
    };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-dark-200">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  // Build tabs based on role
  const tabs = ["profile"];
  if (user?.role === "creator") tabs.push("portfolio");
  tabs.push("social");

  return (
    <Layout title="My Profile">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-500 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-primary-500 text-white"
                : "text-dark-200 hover:text-white hover:bg-dark-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Card */}
            <div className="card text-center">
            {/* Clickable Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-primary-500/20 border-2 border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-3xl overflow-hidden">
                {profile?.avatar || user?.avatar ? (
                    <img
                    src={profile?.avatar || user?.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    />
                ) : (
                    user?.name?.charAt(0).toUpperCase()
                )}
                </div>
                {/* Upload Button Overlay */}
                <button
                onClick={() => document.getElementById("avatarInput").click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors shadow-lg"
                >
                <Camera size={14} className="text-white" />
                </button>
                <input
                id="avatarInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                />
            </div>

            {/* Upload hint */}
            <p className="text-dark-300 text-xs mb-3">Click camera to change photo</p>

            <h3 className="text-white font-bold text-lg">{user?.name}</h3>
            <p className="text-dark-200 text-sm capitalize">{user?.role}</p>
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
                <span className="text-xs bg-primary-500/10 text-primary-400 px-3 py-1 rounded-full capitalize">
                {user?.plan} plan
                </span>
                {user?.isVerified && (
                <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                    ✓ Verified
                </span>
                )}
            </div>
            {profile && (
                <div className="mt-4 pt-4 border-t border-dark-500 text-left space-y-2">
                <p className="text-dark-200 text-xs">
                    📍 {profile.location || "No location set"}
                </p>
                <p className="text-dark-200 text-xs">
                    👁 {profile.profileViews} profile views
                </p>
                {user?.role === "creator" && (
                    <p className="text-dark-200 text-xs">
                    💰 ${profile.amountRaised} raised
                    </p>
                )}
                {user?.role === "investor" && (
                    <p className="text-dark-200 text-xs">
                    📊 ${profile.totalInvested} total invested
                    </p>
                )}
                </div>
            )}
            </div>

          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h3 className="text-white font-bold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell investors about yourself and your skill..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Lagos, Nigeria"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Creator Fields */}
            {user?.role === "creator" && (
              <div className="card">
                <h3 className="text-white font-bold mb-4">Skill & Funding</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Your Skill
                      </label>
                      <input
                        type="text"
                        name="skill"
                        value={form.skill}
                        onChange={handleChange}
                        placeholder="e.g. Fashion Design"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        name="skillCategory"
                        value={form.skillCategory}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {SKILL_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-dark-100 text-sm font-medium mb-2">
                      Funding Purpose
                    </label>
                    <textarea
                      name="fundingPurpose"
                      value={form.fundingPurpose}
                      onChange={handleChange}
                      placeholder="What will you use the funding for?"
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Funding Goal ($)
                      </label>
                      <input
                        type="number"
                        name="fundingGoal"
                        value={form.fundingGoal}
                        onChange={handleChange}
                        placeholder="2000"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Projected Monthly Income ($)
                      </label>
                      <input
                        type="number"
                        name="projectedMonthlyIncome"
                        value={form.projectedMonthlyIncome}
                        onChange={handleChange}
                        placeholder="800"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Profit Share (%)
                      </label>
                      <input
                        type="number"
                        name="profitSharePercentage"
                        value={form.profitSharePercentage}
                        onChange={handleChange}
                        placeholder="20"
                        min="1"
                        max="50"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Duration (months)
                      </label>
                      <input
                        type="number"
                        name="profitShareDuration"
                        value={form.profitShareDuration}
                        onChange={handleChange}
                        placeholder="12"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-dark-700 rounded-xl">
                    <input
                      type="checkbox"
                      id="acceptingInvestments"
                      name="isAcceptingInvestments"
                      checked={form.isAcceptingInvestments}
                      onChange={handleChange}
                      className="w-4 h-4 accent-green-500"
                    />
                    <label
                      htmlFor="acceptingInvestments"
                      className="text-dark-100 text-sm cursor-pointer"
                    >
                      I am currently accepting investments
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Investor Fields */}
            {user?.role === "investor" && (
              <div className="card">
                <h3 className="text-white font-bold mb-4">Investment Preferences</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Investment Budget ($)
                      </label>
                      <input
                        type="number"
                        name="investmentBudget"
                        value={form.investmentBudget}
                        onChange={handleChange}
                        placeholder="5000"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Preferred ROI (%)
                      </label>
                      <input
                        type="number"
                        name="preferredROI"
                        value={form.preferredROI}
                        onChange={handleChange}
                        placeholder="18"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Risk Tolerance
                      </label>
                      <select
                        name="riskTolerance"
                        value={form.riskTolerance}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-dark-100 text-sm font-medium mb-2">
                        Preferred Duration (months)
                      </label>
                      <input
                        type="number"
                        name="preferredDuration"
                        value={form.preferredDuration}
                        onChange={handleChange}
                        placeholder="12"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-dark-100 text-sm font-medium mb-3">
                      Industries of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRIES.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                            form.industriesOfInterest.includes(industry)
                              ? "bg-primary-500 text-white"
                              : "bg-dark-700 text-dark-200 hover:bg-dark-500 hover:text-white"
                          }`}
                        >
                          {industry}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === "portfolio" && user?.role === "creator" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-white font-bold mb-4">
              Upload Portfolio Item
              <span className="text-dark-200 text-sm font-normal ml-2">
                ({profile?.portfolio?.length || 0}/
                {PORTFOLIO_LIMITS[user?.plan]} used)
              </span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div>
                <label className="block text-dark-100 text-sm font-medium mb-2">
                  Image
                </label>
                <div
                  className="border-2 border-dashed border-dark-400 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() =>
                    document.getElementById("portfolioInput").click()
                  }
                >
                  {portfolioPreview ? (
                    <img
                      src={portfolioPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div>
                      <Camera
                        size={32}
                        className="text-dark-300 mx-auto mb-2"
                      />
                      <p className="text-dark-200 text-sm">
                        Click to upload image
                      </p>
                      <p className="text-dark-300 text-xs mt-1">
                        JPEG, PNG or WebP — max 5MB
                      </p>
                    </div>
                  )}
                  <input
                    id="portfolioInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={portfolioTitle}
                    onChange={(e) => setPortfolioTitle(e.target.value)}
                    placeholder="e.g. Wedding Dress Collection"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-dark-100 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={portfolioDescription}
                    onChange={(e) => setPortfolioDescription(e.target.value)}
                    placeholder="Describe this piece of work..."
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>
                <button
                  onClick={handlePortfolioUpload}
                  disabled={uploading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {uploading ? "Uploading..." : "Upload Item"}
                </button>
              </div>
            </div>
          </div>

          {/* Portfolio Grid */}
          {profile?.portfolio?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.portfolio.map((item) => (
                <div
                  key={item._id}
                  className="card p-0 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => handleDeletePortfolio(item._id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-semibold">{item.title}</h4>
                    {item.description && (
                      <p className="text-dark-200 text-sm mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Camera size={48} className="text-dark-300 mx-auto mb-4" />
              <h3 className="text-white font-bold mb-2">
                No portfolio items yet
              </h3>
              <p className="text-dark-200 text-sm">
                Upload your work to attract investors
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SOCIAL TAB ── */}
      {activeTab === "social" && (
        <div className="card max-w-xl">
          <h3 className="text-white font-bold mb-6">Social Links</h3>
          <div className="space-y-4">
            {[
              {
                key: "instagram",
                label: "Instagram",
                placeholder: "https://instagram.com/yourhandle",
              },
              {
                key: "twitter",
                label: "Twitter / X",
                placeholder: "https://twitter.com/yourhandle",
              },
              {
                key: "linkedin",
                label: "LinkedIn",
                placeholder: "https://linkedin.com/in/yourname",
              },
              {
                key: "website",
                label: "Website",
                placeholder: "https://yourwebsite.com",
              },
            ].map((social) => (
              <div key={social.key}>
                <label className="block text-dark-100 text-sm font-medium mb-2">
                  {social.label}
                </label>
                <input
                  type="url"
                  name={`socialLinks.${social.key}`}
                  value={form.socialLinks[social.key]}
                  onChange={handleChange}
                  placeholder={social.placeholder}
                  className="input-field"
                />
              </div>
            ))}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Social Links"}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}