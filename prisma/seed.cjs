const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ─── Mrs. Sima Ved Calendar 2026 — 103 Events ──────────────────────────────
// Parsed from "Mrs. Sima Ved Calendar 2026.csv"
// Categories: Social/Key Moments, Corporate Campaign, Sponsorships, Gifting,
//             Corporate Event, PR Birthdays, HR & CSR, Coca Cola Arena
// Status: Not Started | Approved | Rescheduled | Cancelled
// No priority field — removed per Karim's request 2026-04-02

const EVENTS = [
  // ── JANUARY ──
  { month: 'Jan', category: 'Social/Key Moments', title: "New Year's Day", date: '01 Jan 2026', creativeBriefDue: '17 Nov 2025', round1Due: '02 Dec 2025', round2Due: '07 Dec 2025', finalCreativeDue: '12 Dec 2025' },
  { month: 'Jan', category: 'Social/Key Moments', title: 'Dubai Fashion Week', date: '31 Jan 2026', creativeBriefDue: '17 Dec 2025', round1Due: '01 Jan 2026', round2Due: '06 Jan 2026', finalCreativeDue: '11 Jan 2026' },
  { month: 'Jan', category: 'Sponsorships', title: 'DAVOS (19-23 Jan)', date: '19 Jan 2026', creativeBriefDue: '20 Nov 2025', round1Due: '05 Dec 2025', round2Due: '10 Dec 2025', finalCreativeDue: '15 Dec 2025' },

  // ── FEBRUARY ──
  { month: 'Feb', category: 'Social/Key Moments', title: "Valentine's Day", date: '14 Feb 2026', creativeBriefDue: '31 Dec 2025', round1Due: '15 Jan 2026', round2Due: '20 Jan 2026', finalCreativeDue: '25 Jan 2026' },
  { month: 'Feb', category: 'Social/Key Moments', title: 'Ramadan', date: '18 Feb 2026', creativeBriefDue: '04 Jan 2026', round1Due: '19 Jan 2026', round2Due: '24 Jan 2026', finalCreativeDue: '29 Jan 2026' },
  { month: 'Feb', category: 'Social/Key Moments', title: 'Saudi Founding Day', date: '22 Feb 2026', creativeBriefDue: '08 Jan 2026', round1Due: '23 Jan 2026', round2Due: '28 Jan 2026', finalCreativeDue: '02 Feb 2026' },
  { month: 'Feb', category: 'Social/Key Moments', title: 'Kuwait National Day', date: '25 Feb 2026', creativeBriefDue: '11 Jan 2026', round1Due: '26 Jan 2026', round2Due: '31 Jan 2026', finalCreativeDue: '05 Feb 2026' },
  { month: 'Feb', category: 'Corporate Campaign', title: "Valentine's Day Campaign", date: '14 Feb 2026', creativeBriefDue: '31 Dec 2025', round1Due: '15 Jan 2026', round2Due: '20 Jan 2026', finalCreativeDue: '25 Jan 2026' },
  { month: 'Feb', category: 'Corporate Campaign', title: 'Ramadan Campaign (18 Feb - 18 Mar)', date: '18 Feb 2026', creativeBriefDue: '04 Jan 2026', round1Due: '19 Jan 2026', round2Due: '24 Jan 2026', finalCreativeDue: '29 Jan 2026' },
  { month: 'Feb', category: 'Gifting', title: 'Ramadan Gifting', date: '18 Feb 2026', creativeBriefDue: '20 Dec 2025', round1Due: '04 Jan 2026', round2Due: '09 Jan 2026', finalCreativeDue: '14 Jan 2026' },
  { month: 'Feb', category: 'Sponsorships', title: 'KSA RLC (3-4 Feb)', date: '03 Feb 2026', creativeBriefDue: '05 Dec 2025', round1Due: '20 Dec 2025', round2Due: '25 Dec 2025', finalCreativeDue: '30 Dec 2025' },
  { month: 'Feb', category: 'Corporate Event', title: 'Kora Suhoor Event', date: '26 Feb 2026', creativeBriefDue: '28 Dec 2025', round1Due: '12 Jan 2026', round2Due: '17 Jan 2026', finalCreativeDue: '22 Jan 2026' },
  { month: 'Feb', category: 'HR & CSR', title: 'CSR - Gift it Forward (18 Feb - 18 Mar)', date: '18 Feb 2026', creativeBriefDue: '20 Dec 2025', round1Due: '04 Jan 2026', round2Due: '09 Jan 2026', finalCreativeDue: '14 Jan 2026' },
  { month: 'Feb', category: 'PR Birthdays', title: 'Kris Fade Birthday', date: '27 Feb 2026', creativeBriefDue: '13 Jan 2026', round1Due: '28 Jan 2026', round2Due: '02 Feb 2026', finalCreativeDue: '07 Feb 2026' },
  { month: 'Feb', category: 'Coca Cola Arena', title: 'Coca Cola Arena Basketball Events', date: '26 Feb 2026', creativeBriefDue: '12 Jan 2026', round1Due: '27 Jan 2026', round2Due: '01 Feb 2026', finalCreativeDue: '06 Feb 2026' },

  // ── MARCH ──
  { month: 'Mar', category: 'Social/Key Moments', title: "International Women's Day", date: '08 Mar 2026', creativeBriefDue: '22 Jan 2026', round1Due: '06 Feb 2026', round2Due: '11 Feb 2026', finalCreativeDue: '16 Feb 2026' },
  { month: 'Mar', category: 'Social/Key Moments', title: 'Saudi Flag Day', date: '11 Mar 2026', creativeBriefDue: '25 Jan 2026', round1Due: '09 Feb 2026', round2Due: '14 Feb 2026', finalCreativeDue: '19 Feb 2026' },
  { month: 'Mar', category: 'Social/Key Moments', title: "Children's Day", date: '15 Mar 2026', creativeBriefDue: '29 Jan 2026', round1Due: '13 Feb 2026', round2Due: '18 Feb 2026', finalCreativeDue: '23 Feb 2026' },
  { month: 'Mar', category: 'Social/Key Moments', title: 'Eid Al-Fitr', date: '20 Mar 2026', creativeBriefDue: '03 Feb 2026', round1Due: '18 Feb 2026', round2Due: '23 Feb 2026', finalCreativeDue: '28 Feb 2026' },
  { month: 'Mar', category: 'Social/Key Moments', title: "Mother's Day", date: '21 Mar 2026', creativeBriefDue: '04 Feb 2026', round1Due: '19 Feb 2026', round2Due: '24 Feb 2026', finalCreativeDue: '01 Mar 2026' },
  { month: 'Mar', category: 'Corporate Campaign', title: "International Women's Day Campaign", date: '08 Mar 2026', creativeBriefDue: '22 Jan 2026', round1Due: '06 Feb 2026', round2Due: '11 Feb 2026', finalCreativeDue: '16 Feb 2026' },
  { month: 'Mar', category: 'Corporate Campaign', title: 'Eid Al-Fitr Campaign', date: '20 Mar 2026', creativeBriefDue: '03 Feb 2026', round1Due: '18 Feb 2026', round2Due: '23 Feb 2026', finalCreativeDue: '28 Feb 2026' },
  { month: 'Mar', category: 'Corporate Campaign', title: "Mother's Day Campaign", date: '21 Mar 2026', creativeBriefDue: '04 Feb 2026', round1Due: '19 Feb 2026', round2Due: '24 Feb 2026', finalCreativeDue: '01 Mar 2026' },
  { month: 'Mar', category: 'Gifting', title: 'Eid Al-Fitr Gifting', date: '20 Mar 2026', creativeBriefDue: '19 Jan 2026', round1Due: '03 Feb 2026', round2Due: '08 Feb 2026', finalCreativeDue: '13 Feb 2026' },
  { month: 'Mar', category: 'Gifting', title: "Mother's Day Gifting", date: '21 Mar 2026', creativeBriefDue: '20 Jan 2026', round1Due: '04 Feb 2026', round2Due: '09 Feb 2026', finalCreativeDue: '14 Feb 2026' },
  { month: 'Mar', category: 'Corporate Event', title: 'Country Strategy Meeting Turkey', date: '26 Mar 2026', creativeBriefDue: '25 Jan 2026', round1Due: '09 Feb 2026', round2Due: '14 Feb 2026', finalCreativeDue: '19 Feb 2026' },
  { month: 'Mar', category: 'PR Birthdays', title: 'Rosemin Manji Birthday', date: '13 Mar 2026', creativeBriefDue: '27 Jan 2026', round1Due: '11 Feb 2026', round2Due: '16 Feb 2026', finalCreativeDue: '21 Feb 2026' },
  { month: 'Mar', category: 'PR Birthdays', title: 'Shereen Mitwalli Birthday', date: '18 Mar 2026', creativeBriefDue: '01 Feb 2026', round1Due: '16 Feb 2026', round2Due: '21 Feb 2026', finalCreativeDue: '26 Feb 2026' },
  { month: 'Mar', category: 'Coca Cola Arena', title: 'Coca Cola Arena Basketball Events (12, 15, 24 Mar)', date: '12 Mar 2026', creativeBriefDue: '26 Jan 2026', round1Due: '10 Feb 2026', round2Due: '15 Feb 2026', finalCreativeDue: '20 Feb 2026' },

  // ── APRIL ──
  { month: 'Apr', category: 'Social/Key Moments', title: 'Earth Day', date: '22 Apr 2026', creativeBriefDue: '08 Mar 2026', round1Due: '23 Mar 2026', round2Due: '28 Mar 2026', finalCreativeDue: '02 Apr 2026' },
  { month: 'Apr', category: 'Corporate Event', title: 'World Economic Forum in Saudi Arabia (22-24 Apr)', date: '22 Apr 2026', creativeBriefDue: '21 Feb 2026', round1Due: '08 Mar 2026', round2Due: '13 Mar 2026', finalCreativeDue: '18 Mar 2026' },
  { month: 'Apr', category: 'Coca Cola Arena', title: 'Coca Cola Arena Basketball Events (3, 5, 10, 13, 17 Apr)', date: '03 Apr 2026', creativeBriefDue: '17 Feb 2026', round1Due: '04 Mar 2026', round2Due: '09 Mar 2026', finalCreativeDue: '14 Mar 2026' },
  { month: 'Apr', category: 'Coca Cola Arena', title: 'Coca Cola Arena Atif Aslan Concert', date: '19 Apr 2026', creativeBriefDue: '05 Mar 2026', round1Due: '20 Mar 2026', round2Due: '25 Mar 2026', finalCreativeDue: '30 Mar 2026' },

  // ── MAY ──
  { month: 'May', category: 'Social/Key Moments', title: "International Mother's Day", date: '10 May 2026', creativeBriefDue: '26 Mar 2026', round1Due: '10 Apr 2026', round2Due: '15 Apr 2026', finalCreativeDue: '20 Apr 2026' },
  { month: 'May', category: 'Social/Key Moments', title: 'Arafat Day - Eid Al Adha', date: '26 May 2026', creativeBriefDue: '11 Apr 2026', round1Due: '26 Apr 2026', round2Due: '01 May 2026', finalCreativeDue: '06 May 2026' },
  { month: 'May', category: 'PR Birthdays', title: 'Mona Kattan Birthday', date: '08 May 2026', creativeBriefDue: '24 Mar 2026', round1Due: '08 Apr 2026', round2Due: '13 Apr 2026', finalCreativeDue: '18 Apr 2026' },
  { month: 'May', category: 'Coca Cola Arena', title: 'Coca Cola Arena TBC Concert', date: '10 May 2026', creativeBriefDue: '26 Mar 2026', round1Due: '10 Apr 2026', round2Due: '15 Apr 2026', finalCreativeDue: '20 Apr 2026' },

  // ── JUNE ──
  { month: 'Jun', category: 'Social/Key Moments', title: "Father's Day", date: '21 Jun 2026', creativeBriefDue: '07 May 2026', round1Due: '22 May 2026', round2Due: '27 May 2026', finalCreativeDue: '01 Jun 2026' },
  { month: 'Jun', category: 'Social/Key Moments', title: 'World Social Media Day', date: '30 Jun 2026', creativeBriefDue: '16 May 2026', round1Due: '31 May 2026', round2Due: '05 Jun 2026', finalCreativeDue: '10 Jun 2026' },
  { month: 'Jun', category: 'Corporate Campaign', title: 'AG 30 Years Campaign', date: '01 Jun 2026', creativeBriefDue: '17 Apr 2026', round1Due: '02 May 2026', round2Due: '07 May 2026', finalCreativeDue: '12 May 2026' },
  { month: 'Jun', category: 'Corporate Campaign', title: "Father's Day Campaign", date: '21 Jun 2026', creativeBriefDue: '07 May 2026', round1Due: '22 May 2026', round2Due: '27 May 2026', finalCreativeDue: '01 Jun 2026' },
  { month: 'Jun', category: 'Corporate Campaign', title: 'Summer Campaign', date: '01 Jun 2026', creativeBriefDue: '17 Apr 2026', round1Due: '02 May 2026', round2Due: '07 May 2026', finalCreativeDue: '12 May 2026' },
  { month: 'Jun', category: 'Gifting', title: 'AG 30 Years Gifting', date: '01 Jun 2026', creativeBriefDue: '02 Apr 2026', round1Due: '17 Apr 2026', round2Due: '22 Apr 2026', finalCreativeDue: '27 Apr 2026' },
  { month: 'Jun', category: 'Gifting', title: "Father's Day Gifting", date: '21 Jun 2026', creativeBriefDue: '22 Apr 2026', round1Due: '07 May 2026', round2Due: '12 May 2026', finalCreativeDue: '17 May 2026' },
  { month: 'Jun', category: 'Gifting', title: 'Summer Campaign Gifting', date: '01 Jun 2026', creativeBriefDue: '02 Apr 2026', round1Due: '17 Apr 2026', round2Due: '22 Apr 2026', finalCreativeDue: '27 Apr 2026' },
  { month: 'Jun', category: 'Corporate Event', title: 'FIFA World Cup (11 Jun - 19 Jul)', date: '11 Jun 2026', creativeBriefDue: '12 Apr 2026', round1Due: '27 Apr 2026', round2Due: '02 May 2026', finalCreativeDue: '07 May 2026' },
  { month: 'Jun', category: 'Corporate Event', title: 'Annual Meeting of the New Champions - China (23-25 Jun)', date: '23 Jun 2026', creativeBriefDue: '24 Apr 2026', round1Due: '09 May 2026', round2Due: '14 May 2026', finalCreativeDue: '19 May 2026' },
  { month: 'Jun', category: 'Coca Cola Arena', title: 'Coca Cola Arena - The Beach Boys', date: '11 Jun 2026', creativeBriefDue: '27 Apr 2026', round1Due: '12 May 2026', round2Due: '17 May 2026', finalCreativeDue: '22 May 2026' },

  // ── JULY ──
  { month: 'Jul', category: 'Social/Key Moments', title: 'Selina Ved Wedding', date: '01 Jul 2026', creativeBriefDue: '17 May 2026', round1Due: '01 Jun 2026', round2Due: '06 Jun 2026', finalCreativeDue: '11 Jun 2026' },
  { month: 'Jul', category: 'Social/Key Moments', title: 'International Friendship Day', date: '30 Jul 2026', creativeBriefDue: '15 Jun 2026', round1Due: '30 Jun 2026', round2Due: '05 Jul 2026', finalCreativeDue: '10 Jul 2026' },
  { month: 'Jul', category: 'Corporate Campaign', title: 'Back to School Campaign (Jul - Sep)', date: '01 Jul 2026', creativeBriefDue: '17 May 2026', round1Due: '01 Jun 2026', round2Due: '06 Jun 2026', finalCreativeDue: '11 Jun 2026' },
  { month: 'Jul', category: 'Gifting', title: 'Back to School Gifting', date: '01 Jul 2026', creativeBriefDue: '02 May 2026', round1Due: '17 May 2026', round2Due: '22 May 2026', finalCreativeDue: '27 May 2026' },
  { month: 'Jul', category: 'Corporate Event', title: "Selina's Wedding", date: '30 Jul 2026', creativeBriefDue: '31 May 2026', round1Due: '15 Jun 2026', round2Due: '20 Jun 2026', finalCreativeDue: '25 Jun 2026' },

  // ── AUGUST ──
  { month: 'Aug', category: 'Social/Key Moments', title: 'International Youth Day', date: '12 Aug 2026', creativeBriefDue: '28 Jun 2026', round1Due: '13 Jul 2026', round2Due: '18 Jul 2026', finalCreativeDue: '23 Jul 2026' },
  { month: 'Aug', category: 'Social/Key Moments', title: 'World Entrepreneurs Day', date: '21 Aug 2026', creativeBriefDue: '07 Jul 2026', round1Due: '22 Jul 2026', round2Due: '27 Jul 2026', finalCreativeDue: '01 Aug 2026' },
  { month: 'Aug', category: 'Social/Key Moments', title: 'Back to School', date: '25 Aug 2026', creativeBriefDue: '11 Jul 2026', round1Due: '26 Jul 2026', round2Due: '31 Jul 2026', finalCreativeDue: '05 Aug 2026' },
  { month: 'Aug', category: 'Social/Key Moments', title: "Emirati Women's Day", date: '28 Aug 2026', creativeBriefDue: '14 Jul 2026', round1Due: '29 Jul 2026', round2Due: '03 Aug 2026', finalCreativeDue: '08 Aug 2026' },
  { month: 'Aug', category: 'Corporate Campaign', title: "Emirati Women's Day Campaign", date: '28 Aug 2026', creativeBriefDue: '14 Jul 2026', round1Due: '29 Jul 2026', round2Due: '03 Aug 2026', finalCreativeDue: '08 Aug 2026' },
  { month: 'Aug', category: 'Gifting', title: "Emirati Women's Day Gifting", date: '28 Aug 2026', creativeBriefDue: '29 Jun 2026', round1Due: '14 Jul 2026', round2Due: '19 Jul 2026', finalCreativeDue: '24 Jul 2026' },
  { month: 'Aug', category: 'PR Birthdays', title: 'Safa Siddiqui Birthday', date: '06 Aug 2026', creativeBriefDue: '22 Jun 2026', round1Due: '07 Jul 2026', round2Due: '12 Jul 2026', finalCreativeDue: '17 Jul 2026' },
  { month: 'Aug', category: 'Coca Cola Arena', title: 'Coca Cola Arena DEF Leppard Concert', date: '02 Aug 2026', creativeBriefDue: '18 Jun 2026', round1Due: '03 Jul 2026', round2Due: '08 Jul 2026', finalCreativeDue: '13 Jul 2026' },

  // ── SEPTEMBER ──
  { month: 'Sep', category: 'Social/Key Moments', title: 'Saudi National Day', date: '23 Sep 2026', creativeBriefDue: '09 Aug 2026', round1Due: '24 Aug 2026', round2Due: '29 Aug 2026', finalCreativeDue: '03 Sep 2026' },
  { month: 'Sep', category: 'Corporate Campaign', title: 'Fall/Winter Campaign', date: '01 Sep 2026', creativeBriefDue: '18 Jul 2026', round1Due: '02 Aug 2026', round2Due: '07 Aug 2026', finalCreativeDue: '12 Aug 2026' },
  { month: 'Sep', category: 'Corporate Campaign', title: 'Winter Campaign', date: '01 Sep 2026', creativeBriefDue: '18 Jul 2026', round1Due: '02 Aug 2026', round2Due: '07 Aug 2026', finalCreativeDue: '12 Aug 2026' },
  { month: 'Sep', category: 'Corporate Event', title: 'Country Strategy Meeting on Egypt', date: '01 Sep 2026', creativeBriefDue: '03 Jul 2026', round1Due: '18 Jul 2026', round2Due: '23 Jul 2026', finalCreativeDue: '28 Jul 2026' },
  { month: 'Sep', category: 'PR Birthdays', title: 'Jessica Kahawaty Birthday', date: '12 Sep 2026', creativeBriefDue: '29 Jul 2026', round1Due: '13 Aug 2026', round2Due: '18 Aug 2026', finalCreativeDue: '23 Aug 2026' },

  // ── OCTOBER ──
  { month: 'Oct', category: 'Social/Key Moments', title: 'Pinktober', date: '01 Oct 2026', creativeBriefDue: '17 Aug 2026', round1Due: '01 Sep 2026', round2Due: '06 Sep 2026', finalCreativeDue: '11 Sep 2026' },
  { month: 'Oct', category: 'Social/Key Moments', title: 'World Mental Health Day', date: '10 Oct 2026', creativeBriefDue: '26 Aug 2026', round1Due: '10 Sep 2026', round2Due: '15 Sep 2026', finalCreativeDue: '20 Sep 2026' },
  { month: 'Oct', category: 'Social/Key Moments', title: "Omani Women's Day", date: '17 Oct 2026', creativeBriefDue: '02 Sep 2026', round1Due: '17 Sep 2026', round2Due: '22 Sep 2026', finalCreativeDue: '27 Sep 2026' },
  { month: 'Oct', category: 'Social/Key Moments', title: 'Halloween', date: '31 Oct 2026', creativeBriefDue: '16 Sep 2026', round1Due: '01 Oct 2026', round2Due: '06 Oct 2026', finalCreativeDue: '11 Oct 2026' },
  { month: 'Oct', category: 'Social/Key Moments', title: 'Dubai Fitness Challenge Campaign (31 Oct - 29 Nov)', date: '31 Oct 2026', creativeBriefDue: '16 Sep 2026', round1Due: '01 Oct 2026', round2Due: '06 Oct 2026', finalCreativeDue: '11 Oct 2026' },
  { month: 'Oct', category: 'HR & CSR', title: 'CSR - Pinktober', date: '01 Oct 2026', creativeBriefDue: '02 Aug 2026', round1Due: '17 Aug 2026', round2Due: '22 Aug 2026', finalCreativeDue: '27 Aug 2026' },
  { month: 'Oct', category: 'HR & CSR', title: 'HR - Apparel Got Talent', date: '01 Oct 2026', creativeBriefDue: '02 Aug 2026', round1Due: '17 Aug 2026', round2Due: '22 Aug 2026', finalCreativeDue: '27 Aug 2026' },
  { month: 'Oct', category: 'HR & CSR', title: 'HR - Dubai Fitness Challenge', date: '31 Oct 2026', creativeBriefDue: '01 Sep 2026', round1Due: '16 Sep 2026', round2Due: '21 Sep 2026', finalCreativeDue: '26 Sep 2026' },
  { month: 'Oct', category: 'PR Birthdays', title: 'Huda Kattan Birthday', date: '02 Oct 2026', creativeBriefDue: '18 Aug 2026', round1Due: '02 Sep 2026', round2Due: '07 Sep 2026', finalCreativeDue: '12 Sep 2026' },
  { month: 'Oct', category: 'PR Birthdays', title: 'Amira Sajwani Birthday', date: '12 Oct 2026', creativeBriefDue: '28 Aug 2026', round1Due: '12 Sep 2026', round2Due: '17 Sep 2026', finalCreativeDue: '22 Sep 2026' },
  { month: 'Oct', category: 'Coca Cola Arena', title: 'Coca Cola Arena Richard Marx Concert', date: '03 Oct 2026', creativeBriefDue: '19 Aug 2026', round1Due: '03 Sep 2026', round2Due: '08 Sep 2026', finalCreativeDue: '13 Sep 2026' },

  // ── NOVEMBER ──
  { month: 'Nov', category: 'Social/Key Moments', title: 'Movember (1-30 Nov)', date: '01 Nov 2026', creativeBriefDue: '17 Sep 2026', round1Due: '02 Oct 2026', round2Due: '07 Oct 2026', finalCreativeDue: '12 Oct 2026' },
  { month: 'Nov', category: 'Social/Key Moments', title: 'Diwali', date: '02 Nov 2026', creativeBriefDue: '18 Sep 2026', round1Due: '03 Oct 2026', round2Due: '08 Oct 2026', finalCreativeDue: '13 Oct 2026' },
  { month: 'Nov', category: 'Social/Key Moments', title: 'UAE Flag Day', date: '03 Nov 2026', creativeBriefDue: '19 Sep 2026', round1Due: '04 Oct 2026', round2Due: '09 Oct 2026', finalCreativeDue: '14 Oct 2026' },
  { month: 'Nov', category: 'Social/Key Moments', title: "Single's Day", date: '11 Nov 2026', creativeBriefDue: '27 Sep 2026', round1Due: '12 Oct 2026', round2Due: '17 Oct 2026', finalCreativeDue: '22 Oct 2026' },
  { month: 'Nov', category: 'Social/Key Moments', title: 'Oman National Day', date: '18 Nov 2026', creativeBriefDue: '04 Oct 2026', round1Due: '19 Oct 2026', round2Due: '24 Oct 2026', finalCreativeDue: '29 Oct 2026' },
  { month: 'Nov', category: 'Corporate Campaign', title: 'Diwali Campaign', date: '02 Nov 2026', creativeBriefDue: '18 Sep 2026', round1Due: '03 Oct 2026', round2Due: '08 Oct 2026', finalCreativeDue: '13 Oct 2026' },
  { month: 'Nov', category: 'Gifting', title: 'Diwali Gifting', date: '02 Nov 2026', creativeBriefDue: '03 Sep 2026', round1Due: '18 Sep 2026', round2Due: '23 Sep 2026', finalCreativeDue: '28 Sep 2026' },
  { month: 'Nov', category: 'Corporate Campaign', title: 'UAE Flag Day Campaign', date: '03 Nov 2026', creativeBriefDue: '19 Sep 2026', round1Due: '04 Oct 2026', round2Due: '09 Oct 2026', finalCreativeDue: '14 Oct 2026' },

  // ── DECEMBER ──
  { month: 'Dec', category: 'Social/Key Moments', title: 'UAE National Day', date: '02 Dec 2026', creativeBriefDue: '18 Oct 2026', round1Due: '02 Nov 2026', round2Due: '07 Nov 2026', finalCreativeDue: '12 Nov 2026' },
  { month: 'Dec', category: 'Social/Key Moments', title: 'Bahrain National Day', date: '16 Dec 2026', creativeBriefDue: '01 Nov 2026', round1Due: '16 Nov 2026', round2Due: '21 Nov 2026', finalCreativeDue: '26 Nov 2026' },
  { month: 'Dec', category: 'Social/Key Moments', title: 'Qatar National Day', date: '18 Dec 2026', creativeBriefDue: '03 Nov 2026', round1Due: '18 Nov 2026', round2Due: '23 Nov 2026', finalCreativeDue: '28 Nov 2026' },
  { month: 'Dec', category: 'Social/Key Moments', title: 'Christmas', date: '25 Dec 2026', creativeBriefDue: '10 Nov 2026', round1Due: '25 Nov 2026', round2Due: '30 Nov 2026', finalCreativeDue: '05 Dec 2026' },
  { month: 'Dec', category: 'Corporate Campaign', title: 'UAE National Day Campaign', date: '02 Dec 2026', creativeBriefDue: '18 Oct 2026', round1Due: '02 Nov 2026', round2Due: '07 Nov 2026', finalCreativeDue: '12 Nov 2026' },
  { month: 'Dec', category: 'Gifting', title: 'Festive Gifting', date: '25 Dec 2026', creativeBriefDue: '26 Oct 2026', round1Due: '10 Nov 2026', round2Due: '15 Nov 2026', finalCreativeDue: '20 Nov 2026' },
  { month: 'Dec', category: 'HR & CSR', title: 'CSR - Donation Certificate', date: '01 Dec 2026', creativeBriefDue: '02 Oct 2026', round1Due: '17 Oct 2026', round2Due: '22 Oct 2026', finalCreativeDue: '27 Oct 2026' },
]

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'sims@admin.app' },
    update: {},
    create: { name: 'Karim', email: 'sims@admin.app', password: hashedPassword, role: 'ADMIN' },
  })

  await prisma.user.upsert({
    where: { email: 'editor@sims.app' },
    update: {},
    create: { name: 'Mrs Veds', email: 'editor@sims.app', password: await bcrypt.hash('admin123', 10), role: 'APPROVER' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@sims.app' },
    update: {},
    create: { name: 'Anda', email: 'admin@sims.app', password: await bcrypt.hash('admin123', 10), role: 'APPROVER' },
  })

  // Clear and reseed events
  console.log('Clearing existing events...')
  await prisma.approval.deleteMany({})
  await prisma.comment.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.reference.deleteMany({})
  await prisma.media.deleteMany({})
  await prisma.event.deleteMany({})

  console.log(`Seeding ${EVENTS.length} events...`)
  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i]
    await prisma.event.create({
      data: {
        number: i + 1,
        month: e.month,
        date: e.date,
        title: e.title,
        category: e.category,
        status: 'Not Started',
        creativeBriefDue: e.creativeBriefDue || null,
        round1Due: e.round1Due || null,
        round2Due: e.round2Due || null,
        finalCreativeDue: e.finalCreativeDue || null,
      },
    })
  }

  console.log(`Done! ${EVENTS.length} events seeded.`)
  console.log('Categories:', [...new Set(EVENTS.map(e => e.category))].join(', '))
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
