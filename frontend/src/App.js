import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Technologies from "@/pages/Technologies";
import ProjectTypes from "@/pages/ProjectTypes";
import BaseLocations from "@/pages/BaseLocations";
import SkillsManagement from "@/pages/SkillsManagement";
import ProficiencyRates from "@/pages/ProficiencyRates";
import ProjectEstimator from "@/pages/ProjectEstimator";
import Projects from "@/pages/Projects";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="technologies" element={<Technologies />} />
            <Route path="project-types" element={<ProjectTypes />} />
            <Route path="base-locations" element={<BaseLocations />} />
            <Route path="skills" element={<SkillsManagement />} />
            <Route path="proficiency-rates" element={<ProficiencyRates />} />
            <Route path="estimator" element={<ProjectEstimator />} />
            <Route path="projects" element={<Projects />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;