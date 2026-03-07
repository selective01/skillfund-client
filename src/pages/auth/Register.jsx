import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      toast.error("Please select a role");
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">SkillFund</h1>
          <p className="text-dark-200">Angel investing for everyday skills</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ada Fashion"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-dark-100 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="input-field pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-200 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-dark-100 text-sm font-medium mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "creator" })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    form.role === "creator"
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-dark-400 bg-dark-700 hover:border-dark-300"
                  }`}
                >
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="font-semibold text-white">Creator</div>
                  <div className="text-xs text-dark-200 mt-1">
                    I have a skill and need funding
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "investor" })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    form.role === "investor"
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-dark-400 bg-dark-700 hover:border-dark-300"
                  }`}
                >
                  <div className="text-2xl mb-1">💰</div>
                  <div className="font-semibold text-white">Investor</div>
                  <div className="text-xs text-dark-200 mt-1">
                    I want to invest in skills
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-dark-200 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}