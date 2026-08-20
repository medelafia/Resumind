import Navbar from "~/components/navbar";
import type { Route } from "./+types/home";
import { resumes } from "~/constants";
import ResumeCard from "~/components/resume-card";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const {auth, isLoading, kv} = usePuterStore()
  const navigate = useNavigate()
  const [resumes , setResumes] = useState<Resume[]>([])
  const [loadingResumes , setLoadingResumes] = useState(false)

  useEffect(()=>{
    if(!auth.isAuthenticated) navigate('/auth?next=/')
  }, [auth.isAuthenticated])


  useEffect(() => { 
    const loadResumes = async () => {
      setLoadingResumes(true)
      const resumes = (await kv.list('resume:', true) ) as KVItem[] ;

      const parseResumes = resumes?.map((resume) =>(
        JSON.parse(resume.value) as Resume
      ))
      setResumes(parseResumes || [])
      setLoadingResumes(false)
    }
    loadResumes()
  }, [])

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-center min-h-screen">
    <Navbar />
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>

        {!loadingResumes && resumes?.length == 0 ? (
          <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ):(
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
        <div>
          <img src="/images/resume-scan-2.gif" alt="" className="w-[200px]" />
        </div>
      )}
      { !loadingResumes && resumes.length > 0 && 
        <div className="resumes-section">
          { resumes.map((resume)=><ResumeCard resume={resume} key={resume.id}/>) }
        </div>
      }
    </section>
  </main>
}
