import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import RoleLayout from "../components/layout/RoleLayout";

const FAQ_DATA = {
  general: [
    {
      question: "What is this platform used for?",
      answer: "This platform is designed to help users manage their work more efficiently by offering tools that simplify organization, communication, and collaboration. It provides a structured environment where users can complete tasks, track progress, and stay connected with their teams."
    },
    {
      question: "How do I manage my account?",
      answer: "You can manage your account settings from the 'Settings' tab in the sidebar. There you can update your profile, change your password, and manage notification preferences."
    },
    {
      question: "Can I request a refund?",
      answer: "Refund policies vary depending on your institution. Please contact your administrator or check the finance section for specific details regarding refunds."
    },
    {
      question: "How do I reset my password?",
      answer: "If you've forgotten your password, use the 'Forgot Password' link on the login page. You'll receive an email with instructions on how to set a new password."
    },
    {
      question: "Is my data safe on this platform?",
      answer: "We prioritize security and follow industry-standard practices to protect your data. All sensitive information is encrypted and access is strictly controlled based on roles."
    },
    {
      question: "How do I contact customer support?",
      answer: "For technical issues or general inquiries, you can reach out to our support team through the 'Contact Support' button in the settings or email support@cleared.example.com."
    }
  ],
  account: [
    {
      question: "How do I change my email?",
      answer: "Contact your institution's administrator to request an email change, as it may affect your login credentials."
    }
  ],
  features: [
    {
      question: "What are the core features?",
      answer: "The platform includes digital clearance tracking, document submission, real-time status updates, and automated notifications."
    }
  ]
};

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "account", label: "Account & security" },
  { id: "features", label: "Features & tools" }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [expanded, setExpanded] = useState<string | false>("panel0");

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <RoleLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto", pt: 2 }}>
        <Box display="flex" gap={6} mt={4}>
          {/* Left Category Sidebar */}
          <Box sx={{ width: 220, flexShrink: 0 }}>
            <Box display="flex" flexDirection="column" gap={1}>
              {CATEGORIES.map((cat) => (
                <Box
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: activeCategory === cat.id ? "#ecfeff" : "transparent",
                    color: activeCategory === cat.id ? "#0891b2" : "#64748B",
                    fontWeight: activeCategory === cat.id ? 600 : 500,
                    fontSize: "0.95rem",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: activeCategory === cat.id ? "#ecfeff" : "#F8FAFC",
                    }
                  }}
                >
                  {cat.label}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Content */}
          <Box flex={1}>
            <Box mb={5}>
              <Box
                display="inline-flex"
                alignItems="center"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "99px",
                  backgroundColor: "#ecfeff",
                  mb: 2
                }}
              >
                <Typography sx={{ color: "#0891b2", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                  / FAQS
                </Typography>
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: "3.2rem",
                  color: "#0F172A",
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.1,
                  maxWidth: 500
                }}
              >
                Frequently asked question
              </Typography>
            </Box>

            <Box>
              {(FAQ_DATA[activeCategory as keyof typeof FAQ_DATA] || []).map((faq, index) => {
                const panelId = `panel${index}`;
                const isExpanded = expanded === panelId;

                return (
                  <Accordion
                    key={index}
                    expanded={isExpanded}
                    onChange={handleChange(panelId)}
                    disableGutters
                    elevation={0}
                    sx={{
                      backgroundColor: "transparent",
                      "&:before": { display: "none" },
                      borderBottom: "1px solid #E2E8F0",
                      py: 1
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <Box sx={{ position: "relative", width: 14, height: 14 }}>
                          {/* Horizontal line */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: 0,
                              right: 0,
                              height: 2,
                              backgroundColor: "#0F172A",
                              transform: "translateY(-50%)"
                            }}
                          />
                          {/* Vertical line - hidden when expanded */}
                          <Box
                            sx={{
                              position: "absolute",
                              left: "50%",
                              top: 0,
                              bottom: 0,
                              width: 2,
                              backgroundColor: "#0F172A",
                              transform: "translateX(-50%)",
                              display: isExpanded ? "none" : "block",
                              transition: "all 0.2s"
                            }}
                          />
                        </Box>
                      }
                      sx={{
                        px: 0,
                        "& .MuiAccordionSummary-content": { my: 2.5 },
                        "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "none" }
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "1.1rem" }}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pb: 4, pt: 0 }}>
                      <Typography sx={{ color: "#64748B", fontSize: "1rem", lineHeight: 1.6, maxWidth: 600 }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </RoleLayout>
  );
}
