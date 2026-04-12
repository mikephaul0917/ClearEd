import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import OrganizationBoard from "../../components/organization/OrganizationBoard";
import { ArchiveBoxIcon } from "../../config/navConfig";
import { useAuth } from "../../hooks/useAuth";
import { organizationService } from "../../services";
import { OrganizationCardProps } from "../../components/organization/OrganizationCard";

/**
 * ArchivedOrganizationsPage Component
 * Dedicated page for viewing archived organizations
 */
const ArchivedOrganizationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<OrganizationCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const data = await organizationService.getMyOrganizations();
            const archivedOrgs = data.organizations
                .filter((org: any) => org.status === 'archived')
                .map((org: any) => ({
                    id: org._id,
                    name: org.name,
                    description: org.description,
                    role: org.membership?.role || "member",
                    status: org.status,
                    termName: org.termId ? `${org.termId.semester} ${org.termId.academicYear}` : "Past Term",
                    institutionName: user?.institutionId || "Institution",
                    color: org.themeColor || "#64748B",
                    headerImage: org.headerImage
                }));
            setOrganizations(archivedOrgs);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            // Add deliberate delay for premium feel
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleCardClick = (id: string) => {
        navigate(`/organization/${id}`);
    };

    if (!user) return null;

    return (
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
                <OrganizationBoard
                    organizations={organizations}
                    loading={loading}
                    onCardClick={handleCardClick}
                    title="Archived Organizations"
                    description="Read-only view of organizations that are no longer active."
                    emptyTitle="No archived organizations"
                    emptyMessage="You don't have any archived organizations from past terms."
                    icon={<ArchiveBoxIcon />}
                    iconBgColor="#F1F5F9"
                    iconColor="#475569"
                />
            </Box>
        </>
    );
};

export default ArchivedOrganizationsPage;
