import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck } from "lucide-react";

const Section = ({ title, children }) =>
<div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>;


export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full">
      <div className="w-full flex items-center gap-3 px-5 pt-6 pb-4 bg-gray-50 dark:bg-gray-950 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)}><ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Last updated: June 30, 2026</p>

        <Section title="1. What Data We Collect">
          <p>When you use Levli, we collect the following personal health data that you voluntarily provide:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Medication shot logs (drug name, dose, date, time, injection site, pain level, notes)</li>
            <li>Daily health metrics (weight, calories, protein, water, fiber, carbohydrates, exercise minutes)</li>
            <li>Progress photos uploaded by you</li>
            <li>Journal entries (text, mood, category, date)</li>
            <li>Profile information (height, goal weight, preferred units, default medication)</li>
            <li>Account information (email address, authentication data)</li>
          </ul>
        </Section>

        <Section title="2. How Your Data Is Stored">
          <p>All data you enter is stored securely in our cloud database and is tied directly to your individual user account. Your data is protected with industry-standard security measures including encrypted connections (HTTPS/TLS).</p>
          <p>Only you can access your own records. We do not share your health data between user accounts.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>Your data is used exclusively to provide and improve the Levli app experience, including:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Displaying your shot history and scheduling your next dose</li>
            <li>Computing estimated medication levels and health trends</li>
            <li>Generating reports and insights within the app</li>
          </ul>
          <p>We do not use your data for advertising or sell it to any third parties — ever.</p>
        </Section>

        <Section title="4. Third-Party Sharing">
          <p>We do <span className="text-gray-900 dark:text-white font-semibold">not</span> sell, rent, or trade your personal or health data to any third party. We do not share your data with advertisers, data brokers, or analytics companies.</p>
          <p>We may use trusted service providers (e.g., cloud hosting) solely to operate the app. These providers are contractually prohibited from using your data for any other purpose.</p>
        </Section>

        <Section title="5. Medical Disclaimer">
          <p>Levli is not a substitute for professional medical care. The information and data tracked in this app are for personal reference only.</p>
          <p className="text-gray-900 dark:text-white font-medium">Only your doctor can diagnose and treat medical problems. Always consult a qualified healthcare professional before making changes to your medication or treatment plan.</p>
        </Section>

        <Section title="6. Data Retention & Deletion">
          <p>Your data is retained for as long as your account is active. You can export everything you have saved as CSV or PDF at any time from Settings → Your data, delete individual records in the app, or delete your account and all of its data from Settings → Delete my account and all data. Deletion removes your records from our servers.</p>
          <p>Levli is for adults aged 18 and over. We do not collect data from children.</p>
          <p>We do not use your health data for advertising, we do not sell it, and we do not run third-party analytics that receive the content of your health records.</p>
          <p>To request full deletion of your account and all associated data, email us at:</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">privacy@levli.app</p>
          <p>We will process deletion requests within 30 days.</p>
        </Section>

        <Section title="7. Contact">
          <p>For any privacy-related questions or concerns, contact us at:</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">privacy@levli.app</p>
        </Section>

        <div className="py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">© 2026 Levli · Privacy Policy, version 1.0</p>
        </div>
      </div>
    </div>);

}