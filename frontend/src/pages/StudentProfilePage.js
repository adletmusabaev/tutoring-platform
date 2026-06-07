import React from 'react';
import { useParams } from 'react-router-dom';
import ProfilePage from './ProfilePage';

function StudentProfilePage() {
  const { id } = useParams();

  return <ProfilePage viewedUserId={id} readOnly />;
}

export default StudentProfilePage;
