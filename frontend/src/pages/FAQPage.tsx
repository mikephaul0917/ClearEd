import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import RoleLayout from "../components/layout/RoleLayout";
import { useTheme, useMediaQuery } from "@mui/material";

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

const fontStack = "'Inter', 'Plus Jakarta Sans', sans-serif";

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [expanded, setExpanded] = useState<string | false>("panel0");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <RoleLayout>
      <Box sx={{ maxWidth: 1200, ml: 0, pt: 4, pb: 8, pl: isMobile ? 2 : 0, pr: isMobile ? 2 : 6, mx: isMobile ? "auto" : 0 }}>
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={isMobile ? 4 : 20}>
          
          {/* Sidebar Nav */}
          <Box sx={{ width: isMobile ? "100%" : 240, flexShrink: 0 }}>
            <Box display="flex" flexDirection={isMobile ? "row" : "column"} gap={1} sx={{ overflowX: isMobile ? 'auto' : 'visible' }}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <Box
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: isActive ? "#ecfeff" : "transparent",
                      color: isActive ? "#0891b2" : "#64748B",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.95rem",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        backgroundColor: isActive ? "#ecfeff" : "#F8FAFC",
                      }
                    }}
                  >
                    {cat.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Content Area */}
          <Box flex={1}>
            {/* Badge */}
            <Box mb={1}>
               <Typography sx={{ color: "#0891b2", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em" }}>
                  / FAQS
               </Typography>
            </Box>
            
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: isMobile ? "2.5rem" : "3.5rem",
                color: "#0F172A",
                fontFamily: fontStack,
                lineHeight: 1.1,
                mb: 6,
                letterSpacing: '-0.04em'
              }}
            >
              Frequently asked<br />question
            </Typography>

            <Box>
              {(FAQ_DATA[activeCategory as keyof typeof FAQ_DATA] || []).map((faq, index) => {
                const panelId = `panel${index}`;
                const isExpanded = expanded === panelId;

                return (
                  <Box key={index}>
                    <Accordion
                      expanded={isExpanded}
                      onChange={handleChange(panelId)}
                      disableGutters
                      elevation={0}
                      sx={{
                        backgroundColor: "transparent",
                        "&:before": { display: "none" },
                        py: 1
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box sx={{ fontSize: '24px', fontWeight: 400, color: '#0F172A', transition: 'all 0.2s' }}>
                            {isExpanded ? "−" : "+"}
                          </Box>
                        }
                        sx={{
                          px: 0,
                          "& .MuiAccordionSummary-content": { my: 2 },
                          "& .MuiAccordionSummary-expandIconWrapper": { transform: 'none' }
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "1.25rem", fontFamily: fontStack }}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, pb: 4, pt: 0 }}>
                        <Typography sx={{ color: "#64748B", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 700, fontFamily: fontStack }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    <Divider sx={{ borderColor: '#F1F5F9' }} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </RoleLayout>
  );
}
