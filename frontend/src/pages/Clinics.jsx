// src/pages/Clinics.jsx
import IndustryPage from './IndustryPage'

export default function Clinics() {
  return (
    <IndustryPage
      emoji="🏥"
      title="Build Patient Trust Through Better Review Responses"
      subtitle="Show patients you care about their health and feedback. Professional, empathetic review management for Indian healthcare providers."
      trustLine="Trusted by clinics and hospitals across India 🇮🇳"
      problems={[
          { icon: "🏥", title: "Patient Reviews Impact Trust", desc: "92% of patients read reviews before choosing a doctor. Unanswered reviews signal you don't care about patient experience." },
          { icon: "⏰", title: "Wait Time Complaints Spread", desc: "One review about 'long wait times' or 'rude staff' can cost you dozens of potential patients choosing a competitor clinic." },
          { icon: "🔒", title: "Privacy is Paramount", desc: "Responding to patient reviews requires extra care — you can't share medical details. Generic responses feel dismissive." },
      ]}
      scenarios={[
          {
            stars: 5, review: "Dr. Kumar was so patient and explained everything clearly. Best dentist!",
            reply: "Thank you so much for your kind words! Dr. Kumar and our team are dedicated to making sure every patient feels informed and comfortable. We're happy we could provide you with excellent care. Looking forward to seeing you at your next checkup! 😊",
            why: ['Professional and warm', 'No medical details shared', 'Encourages return visit'],
          },
          {
            stars: 2, review: "Had to wait 45 minutes past my appointment time. Not acceptable.",
            reply: "We sincerely apologize for the extended wait time. We understand your time is valuable, and this is not the standard of care we aim to provide. We're implementing a new scheduling system to prevent this. Thank you for bringing this to our attention — we hope you'll give us another chance to serve you better.",
            why: ['Apologises sincerely', 'Shows action taken', 'Privacy-safe response'],
          },
      ]}
      results={[
          {
            biz: "Kumar Dental Clinic, Bangalore",
            before: ['4.1★ rating', '35% response rate'],
            after: ['4.7★ rating', '100% response rate'],
            quote: "Managing 3 clinic locations was a nightmare. Now I see all reviews in one dashboard and respond from my phone.",
            name: "Dr. Rajesh Kumar",
          },
      ]}
      faqs={[
          { q: "Will the AI share patient medical information?", a: "No. ReviewPilot's AI is designed to keep responses general and professional — never sharing medical details in public replies." },
          { q: "Is it suitable for hospitals with multiple departments?", a: "Yes. The Enterprise plan supports unlimited locations and team members — perfect for multi-speciality hospitals." },
      ]}
    />
  )
}
