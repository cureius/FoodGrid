"use client";
import styled from "styled-components";
import { Navbar } from "@/components/ui/Navbar";
import { OrderCard } from "@/components/ui/OrderCard";
import { Plus, CreditCard, Clock, CheckCircle, FileText, ChevronRight } from "lucide-react";
import { COLORS } from "@/lib/constants";

const Main = styled.main`
  background: ${COLORS.bg};
  min-height: 100vh;
  padding: clamp(84px, 7vw, 120px) clamp(14px, 4vw, 56px) clamp(16px, 3vw, 48px);

  @media (min-width: 1600px) {
    padding-left: 72px;
    padding-right: 72px;
  }

  @media (max-width: 640px) {
    padding-top: 76px;
  }
`;

const PageMax = styled.div`
  max-width: 1680px;
  margin: 0 auto;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 1600px) {
    gap: 32px;
  }
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Title = styled.h1`
  font-size: clamp(18px, 1.7vw, 28px);
  font-weight: 800;
  margin: 0;
`;

const SubTitle = styled.p`
  color: ${COLORS.textMuted};
  font-size: clamp(12px, 1.05vw, 14px);
  margin: 6px 0 0;
`;

const TimeBlock = styled.div`
  text-align: right;

  @media (max-width: 640px) {
    text-align: left;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 12px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 1600px) {
    gap: 24px;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 14px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  border: 1px solid ${COLORS.border};
  gap: 12px;
  min-width: 0;
`;

const CardLabel = styled.p`
  color: ${COLORS.textMuted};
  font-size: 14px;
  margin: 0 0 8px;
`;

const CardValue = styled.h2`
  font-size: clamp(22px, 2.1vw, 30px);
  font-weight: 800;
  margin: 0;
`;

const IconBox = styled.div`
  width: 40px;
  height: 40px;
  background: ${COLORS.iconBg};
  color: ${COLORS.primary};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
`;

const TwoColSections = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 16px;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid ${COLORS.border};
  min-height: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 18px;
  }
`;

const SectionTitle = styled.h3`
  font-size: clamp(14px, 1.2vw, 18px);
  font-weight: 800;
  margin: 0 0 20px;
`;

const SectionFooter = styled.div`
  margin-top: auto;
  text-align: center;
  border-top: 1px solid ${COLORS.border};
  padding-top: 16px;
  font-weight: 700;
  color: ${COLORS.textMain};
  cursor: pointer;
`;

const RightColumn = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;

  @media (max-width: 1024px) {
    order: 2;
  }
`;

const CreateBtn = styled.button`
  background: ${COLORS.primary};
  color: white;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(75, 139, 255, 0.2);

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

const ScrollSection = styled(Section)`
  min-height: auto;
`;

const ScrollBody = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 240px;
  max-height: clamp(260px, 36vh, 420px);

  @media (max-width: 1024px) {
    max-height: 340px;
  }

  @media (max-width: 640px) {
    max-height: 280px;
  }

  @media (min-width: 1600px) {
    max-height: 520px;
  }
`;

const Select = styled.select`
  background: none;
  border: 1px solid ${COLORS.border};
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
`;

export default function Dashboard() {
  return (
    <Main>
      <Navbar />
      <PageMax>
        <ContentGrid>
          <LeftColumn>
            <HeaderRow>
              <div>
                <Title>Good Morning, Richardo</Title>
                <SubTitle>Give your best services for customers, happy working 😌</SubTitle>
              </div>
              <TimeBlock>
                <Title>09:55:02</Title>
                <SubTitle>Thu, 2 April 2025</SubTitle>
              </TimeBlock>
            </HeaderRow>

            <StatGrid>
              {[
                { label: "Total Earning", val: "$ 1,400", icon: CreditCard },
                { label: "In Progress", val: "11", icon: Clock },
                { label: "Ready to Served", val: "5", icon: CheckCircle },
                { label: "Completed", val: "8", icon: FileText },
              ].map((s, i) => (
                <StatCard key={i}>
                  <div style={{ minWidth: 0 }}>
                    <CardLabel>{s.label}</CardLabel>
                    <CardValue>{s.val}</CardValue>
                  </div>
                  <IconBox>
                    <s.icon size={20} />
                  </IconBox>
                </StatCard>
              ))}
            </StatGrid>

            <TwoColSections>
              <Section>
                <SectionTitle>In Progress</SectionTitle>
                <OrderCard orderId="DI008" type="Dine In" time="Mon, 17 Feb 03:43 PM" name="Daniel" table="A1" items={6} progress={10} />
                <OrderCard orderId="TA001" type="Take Away" time="Mon, 17 Feb 02:56 PM" name="Vlona" table="V" items={3} progress={60} />
                <SectionFooter>
                  See All Order <ChevronRight size={16} style={{ verticalAlign: "middle" }} />
                </SectionFooter>
              </Section>
              <Section>
                <SectionTitle>Waiting for Payments</SectionTitle>
                <OrderCard orderId="DI002" type="Dine In" time="Mon, 17 Feb 10:32 AM" name="Daniel" table="A4" items={6} status="Waiting for Payment" />
                <OrderCard orderId="DI001" type="Dine In" time="Mon, 17 Feb 10:24 AM" name="Eve" table="B3" items={6} status="Waiting for Payment" />
                <SectionFooter>
                  See All Order <ChevronRight size={16} style={{ verticalAlign: "middle" }} />
                </SectionFooter>
              </Section>
            </TwoColSections>
          </LeftColumn>

          <RightColumn>
            <CreateBtn>
              <Plus size={20} /> Create New Order
            </CreateBtn>

            <ScrollSection>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0, gap: 12 }}>
                <SectionTitle style={{ marginBottom: 0 }}>Table Available</SectionTitle>
                <Select>
                  <option>First Floor</option>
                </Select>
              </div>
              <ScrollBody>
                {[
                  "A1",
                  "A7",
                  "A8",
                  "A15",
                  "A1",
                  "A7",
                  "A8",
                  "A15",
                  "A1",
                  "A7",
                  "A8",
                  "A15",
                  "A1",
                  "A7",
                  "A8",
                  "A15",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "14px", gap: 12 }}>
                    <span style={{ fontWeight: 700 }}>{t}</span>
                    <span style={{ color: COLORS.textMuted }}>{t === "A15" ? "6" : "4"} Person</span>
                  </div>
                ))}
              </ScrollBody>
            </ScrollSection>

            <ScrollSection>
              <SectionTitle>Out of Stock</SectionTitle>
              <ScrollBody>
                {[
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                  { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
                  { name: "BBQ Beef Ribs", time: "04:30 PM" },
                  { name: "Veggie Supreme Pizza", time: "04:30 PM" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0f0f0", overflow: "hidden", flex: "0 0 auto" }}>
                      <img
                        alt={item.name}
                        src={`https://source.unsplash.com/100x100/?food,${i}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ color: COLORS.primary, fontSize: "12px", fontWeight: 600 }}>Available: {item.time}</div>
                    </div>
                  </div>
                ))}
              </ScrollBody>
            </ScrollSection>
          </RightColumn>
        </ContentGrid>
      </PageMax>
    </Main>
  );
}