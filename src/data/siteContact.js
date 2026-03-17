import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaGlobe, FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { SiMedium } from 'react-icons/si';

export const contactDetails = [
  {
    label: 'Email',
    value: 'muyiwa.j.obadara@gmail.com',
    href: 'mailto:muyiwa.j.obadara@gmail.com',
    Icon: FaEnvelope,
  },
  {
    label: 'Location',
    value: 'Nigeria',
    href: null,
    Icon: FaMapMarkerAlt,
  },
  {
    label: 'Phone',
    value: '+234 808 194 3523',
    href: 'tel:+2348081943523',
    Icon: FaPhoneAlt,
  },
  {
    label: 'Portfolio',
    value: 'mobadara.dev',
    href: 'https://mobadara.dev',
    Icon: FaGlobe,
  },
];

export const socialLinks = [
  { href: 'https://linkedin.com/in/muyiwa-obadara', Icon: FaLinkedin, label: 'LinkedIn', cls: 'linkedin' },
  { href: 'https://twitter.com/mobadara', Icon: FaTwitter, label: 'Twitter', cls: 'twitter' },
  { href: 'https://github.com/mobadara', Icon: FaGithub, label: 'GitHub', cls: 'github' },
  { href: 'https://mobadara.medium.com', Icon: SiMedium, label: 'Medium', cls: 'medium' },
];
