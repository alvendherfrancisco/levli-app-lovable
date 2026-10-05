import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";

const Section = ({ title, children }) =>
<div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>;


export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <div className="w-full flex items-center gap-3 px-5 pt-6 pb-4 bg-gray-50 dark:bg-gray-950 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)}><ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Use</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Last updated: June 30, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account and using Levli, you agree to these Terms and Conditions. If you do not agree, please do not use the app.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Levli is a personal health tracking application that allows users to log GLP-1 medication shots, track daily health metrics (weight, nutrition, exercise), record journal entries, and view trends and insights based on their own data.</p>
        </Section>

        <Section title="3. Medical Disclaimer">
          <p>Levli is <span className="text-gray-900 dark:text-white font-semibold">not</span> a medical device and is not intended to diagnose, treat, cure, or prevent any disease or medical condition.</p>
          <p className="text-gray-900 dark:text-white font-medium">This application is not a substitute for professional medical care. Only your doctor can diagnose and treat medical problems. Always consult a qualified healthcare professional before making any changes to your medication or treatment plan.</p>
          <p>Medication level estimates shown in the app are based on general pharmacokinetic models and are for informational purposes only — they do not reflect actual blood concentrations.</p>
        </Section>

        <Section title="4. User Responsibilities">
          <p>You are responsible for:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Maintaining the security of your account credentials</li>
            <li>Ensuring the accuracy of the data you enter</li>
            <li>Using the app only for personal, non-commercial health tracking</li>
            <li>Not sharing your account with others</li>
          </ul>
        </Section>

        <Section title="5. Your Data">
          <p>You retain full ownership of all health data you enter into Levli. We act only as a data processor to operate the service on your behalf. See our Privacy Policy for full details on how data is stored and protected.</p>
        </Section>

        <Section title="6. Prohibited Use">
          <p>You agree not to use Levli to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Provide medical advice to others</li>
            <li>Circumvent, hack, or abuse the platform</li>
            <li>Upload illegal, harmful, or inappropriate content</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the maximum extent permitted by law, Levli and its developers are not liable for any health decisions made based on information displayed in the app, or for any loss of data.</p>
          <p>The app is provided "as is" without warranties of any kind.</p>
        </Section>

        <Section title="8. Changes to Terms">
          <p>We may update these terms from time to time. Continued use of the app after changes are posted constitutes your acceptance of the updated terms.</p>
        </Section>

        <Section title="9. Contact">
          <p>For questions about these terms, contact us at:</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">support@levli.app</p>
        </Section>

        <div className="py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">© 2026 Levli · Terms of Use, version 1.0</p>
        </div>
      </div>
    </div>);

}