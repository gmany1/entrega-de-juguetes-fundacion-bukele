import React from 'react';
import Hero from './Hero';
import InfoSection from './InfoSection';
import RSVPForm from './RSVPForm';

const EventDemoPage: React.FC = () => {
    return (
        <div className="flex flex-col font-sans text-slate-800">
            <Hero />
            <main className="flex-grow">
                {/* InfoSection might be redundant or needs update, keeping for now but maybe verify content later */}
                {/* <InfoSection /> */}
                <RSVPForm />
            </main>
        </div>
    );
};

export default EventDemoPage;
