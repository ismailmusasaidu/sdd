import { useEffect, useRef } from 'react';
import { Linkedin, Mail } from 'lucide-react';

interface TeamMember {
  name: string;
  position: string;
  image: string;
  bio: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Ahmad Hassan',
    position: 'Founder & CEO',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Visionary leader with 15+ years in service industry'
  },
  {
    name: 'Fatima Adeyemi',
    position: 'Chief Operations Officer',
    image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Expert in operational excellence and team management'
  },
  {
    name: 'Musa Ibrahim',
    position: 'Head of Technology',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Tech innovator building scalable solutions'
  },
  {
    name: 'Zainab Muhammad',
    position: 'Head of Quality Assurance',
    image: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Ensuring highest standards in service delivery'
  },
  {
    name: 'Ibrahim Yusuf',
    position: 'Community Manager',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Building and nurturing our vibrant community'
  },
  {
    name: 'Aisha Kano',
    position: 'Marketing Director',
    image: 'https://images.pexels.com/photos/1381690/pexels-photo-1381690.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Connecting us with customers across the region'
  }
];

export default function TeamSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.3;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...teamMembers, ...teamMembers].map((member, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="mb-4 overflow-hidden rounded-xl">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-64 object-cover"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
            <p className="text-primary-600 font-semibold text-sm mb-3">{member.position}</p>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 bg-primary-50 text-primary-600 py-2 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium">
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                <Mail size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
