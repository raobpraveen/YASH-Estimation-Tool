import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Sun, Moon, Palette, Calendar, Hash, Globe, Upload, 
  Monitor, Image, Save, RotateCcw, User, Settings as SettingsIcon 
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY (e.g., 23-Feb-2026)" },
];

const NUMBER_FORMATS = [
  { value: "en-US", label: "1,234.56 (US)" },
  { value: "en-IN", label: "1,23,456.78 (India)" },
  { value: "de-DE", label: "1.234,56 (Europe)" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
];

const PRESET_THEMES = [
  { 
    id: "light", 
    name: "Light", 
    icon: Sun,
    colors: { bg: "#ffffff", text: "#0F172A", primary: "#0EA5E9", secondary: "#F1F5F9" }
  },
  { 
    id: "dark", 
    name: "Dark", 
    icon: Moon,
    colors: { bg: "#0F172A", text: "#F8FAFC", primary: "#0EA5E9", secondary: "#1E293B" }
  },
  { 
    id: "system", 
    name: "System", 
    icon: Monitor,
    colors: null
  },
];

const Settings = () => {
  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    theme: "light",
    customThemeImage: "",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
    currency: "USD",
    compactNumbers: true,
    showGridLines: true,
    defaultProfitMargin: 35,
    defaultContingency: 5,
  });
  
  const [originalSettings, setOriginalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  // Apply theme immediately when it changes
  useEffect(() => {
    applyTheme(settings.theme, settings.customThemeImage);
  }, [settings.theme, settings.customThemeImage]);

  const applyTheme = (theme, customImage) => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.setProperty("--bg-color", "#0F172A");
      root.style.setProperty("--text-color", "#F8FAFC");
      root.style.setProperty("--card-bg", "#1E293B");
      document.body.style.backgroundColor = "#0F172A";
      document.body.style.color = "#F8FAFC";
    } else if (theme === "light") {
      root.classList.remove("dark");
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--text-color", "#0F172A");
      root.style.setProperty("--card-bg", "#ffffff");
      document.body.style.backgroundColor = "#F8FAFC";
      document.body.style.color = "#0F172A";
    } else if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light", customImage);
    } else if (theme === "custom" && customImage) {
      root.classList.remove("dark");
      document.body.style.backgroundImage = `url(${customImage})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
    }
    
    if (theme !== "custom") {
      document.body.style.backgroundImage = "none";
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/user/settings`, axiosConfig);
      if (response.data) {
        const fetchedSettings = { ...settings, ...response.data };
        setSettings(fetchedSettings);
        setOriginalSettings(fetchedSettings);
      }
    } catch (error) {
      // If no settings exist, use defaults
      setOriginalSettings(settings);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/user/settings`, settings, axiosConfig);
      setOriginalSettings(settings);
      localStorage.setItem("userSettings", JSON.stringify(settings));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      toast.info("Settings reset to last saved state");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, theme: "custom", customThemeImage: reader.result });
      toast.success("Custom theme image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div data-testid="settings-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">Settings</h1>
          <p className="text-base text-gray-600 mt-2">Customize your experience</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={handleResetSettings}
              data-testid="reset-settings-btn"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button 
            onClick={handleSaveSettings}
            disabled={loading || !hasChanges}
            className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90"
            data-testid="save-settings-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Defaults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Selection */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#0EA5E9]" />
                Theme
              </CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESET_THEMES.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => updateSetting("theme", theme.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.theme === theme.id
                          ? "border-[#0EA5E9] bg-[#0EA5E9]/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      data-testid={`theme-${theme.id}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon className={`w-8 h-8 ${settings.theme === theme.id ? "text-[#0EA5E9]" : "text-gray-500"}`} />
                        <span className="font-medium">{theme.name}</span>
                      </div>
                    </button>
                  );
                })}
                
                {/* Custom Theme Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === "custom"
                      ? "border-[#0EA5E9] bg-[#0EA5E9]/10"
                      : "border-gray-200 hover:border-gray-300 border-dashed"
                  }`}
                  data-testid="theme-custom"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Image className={`w-8 h-8 ${settings.theme === "custom" ? "text-[#0EA5E9]" : "text-gray-500"}`} />
                    <span className="font-medium">Custom</span>
                    <span className="text-xs text-gray-500">Upload Image</span>
                  </div>
                </button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {settings.theme === "custom" && settings.customThemeImage && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="mb-2 block">Custom Background Preview</Label>
                  <div 
                    className="h-32 rounded-lg bg-cover bg-center border"
                    style={{ backgroundImage: `url(${settings.customThemeImage})` }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => updateSetting("customThemeImage", "")}
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#0F172A]">Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Numbers</Label>
                  <p className="text-sm text-gray-500">Show large numbers as 1.2M instead of 1,200,000</p>
                </div>
                <Switch
                  checked={settings.compactNumbers}
                  onCheckedChange={(v) => updateSetting("compactNumbers", v)}
                  data-testid="compact-numbers-toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Grid Lines</Label>
                  <p className="text-sm text-gray-500">Display grid lines in tables</p>
                </div>
                <Switch
                  checked={settings.showGridLines}
                  onCheckedChange={(v) => updateSetting("showGridLines", v)}
                  data-testid="grid-lines-toggle"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                Date & Number Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Date Format</Label>
                  <Select 
                    value={settings.dateFormat} 
                    onValueChange={(v) => updateSetting("dateFormat", v)}
                  >
                    <SelectTrigger data-testid="date-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: {new Date().toLocaleDateString("en-US", { 
                      year: "numeric", month: "2-digit", day: "2-digit" 
                    })}
                  </p>
                </div>

                <div>
                  <Label>Number Format</Label>
                  <Select 
                    value={settings.numberFormat} 
                    onValueChange={(v) => updateSetting("numberFormat", v)}
                  >
                    <SelectTrigger data-testid="number-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NUMBER_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: {(1234567.89).toLocaleString(settings.numberFormat)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#0EA5E9]" />
                Currency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label>Default Currency</Label>
                <Select 
                  value={settings.currency} 
                  onValueChange={(v) => updateSetting("currency", v)}
                >
                  <SelectTrigger data-testid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Preview: {CURRENCY_OPTIONS.find(c => c.value === settings.currency)?.symbol}10,000
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6">
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#0F172A]">Project Defaults</CardTitle>
              <CardDescription>Default values for new projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Default Profit Margin (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultProfitMargin}
                    onChange={(e) => updateSetting("defaultProfitMargin", parseFloat(e.target.value) || 0)}
                    data-testid="default-profit-margin"
                  />
                  <p className="text-xs text-gray-500 mt-1">Applied to new projects</p>
                </div>
                <div>
                  <Label>Default Contingency (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.defaultContingency}
                    onChange={(e) => updateSetting("defaultContingency", parseFloat(e.target.value) || 0)}
                    data-testid="default-contingency"
                  />
                  <p className="text-xs text-gray-500 mt-1">Applied to logistics calculations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
