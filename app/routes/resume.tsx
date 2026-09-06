import { memo, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Ats from '~/components/ats';
import Details from '~/components/details';
import Summary from '~/components/summary';
import { usePuterStore } from '~/lib/puter';


const meta = () => ([
  {title : "Resumind | Resume"}, 
  {name : "description" , content : "Detailed overview of your resume"}
])

const Resume = () => {
    const {id} = useParams()
    const {kv, auth, isLoading, fs} = usePuterStore()
    const [resumeUrl, setResumeUrl] = useState('')
    const [imageUrl , setImageUrl] = useState('')
    const [feedback, setFeedback] = useState<Feedback|null>(null)
    const navigate = useNavigate()
    const [ resume , setResume] = useState<Resume|null>()


    const deleteResume = async () => {
        if(!window.confirm("Do you want to remove this resume?")) return;
        if (!resume) return;

        try {
            if (resume.imagePath) {
                await fs.delete(resume.imagePath);
            }

            if (resume.resumePath) {
                await fs.delete(resume.resumePath);
            }

            await kv.del(`resume:${id}`);

            navigate('/');
        } catch (error) {
            console.error("Delete resume error:", error);
        }
    };
    useEffect(()=>{
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`)
    }, [isLoading])

    useEffect(()=>{
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`)
            
            if(!resume) return; 
            
            const data = JSON.parse(resume)

            setResume(data as Resume)

            console.log(data)
            const resumeBlob = await fs.read(data.resumePath) 
            if(!resumeBlob) return; 

            const pdfBlob = new Blob([resumeBlob], {type : 'application/pdf'})
            const resumeUrl = URL.createObjectURL(pdfBlob) 

            setResumeUrl(resumeUrl)

            const imageBlob = await fs.read(data.imagePath) 
            if(!imageBlob) return; 

            const imageUrl = URL.createObjectURL(imageBlob) 
            setImageUrl(imageUrl)

            setFeedback(data.feedback)
        }

        loadResume()
    }, [id])
    return (
        <main className='!pt-0'>
            <nav className='resume-nav flex flex-row items-center justify-between'>
                <Link to="/" className='back-button'>
                    <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5' />
                    <span className='text-gray-800 text-sm font-semibold'>
                        Back to Homepage
                    </span>
                </Link>
                <button className='w-fit primary-button' onClick={deleteResume}>
                    Delete now
                </button>
            </nav>
            <div className='flex flex-row w-full max-lg:flex-col-reverse'>
                <section className='feedback-section bg-[url("/images/bg-small.svg")] bg-cover h-[100vh] sticky top-0 items-center justify-center'>
                    {resumeUrl && imageUrl && (
                        <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit'>
                            <a href={resumeUrl} target='_blank' rel='noopener noreferrer'>
                                <img 
                                    src={imageUrl}
                                    className='w-full h-full object-contain rounded-2xl'
                                    title='resume'
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {
                        feedback ? (
                            <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
                                <Summary feedback={feedback} />
                                <Ats score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []}/>
                                <Details feedback={feedback}/>
                            </div>
                        ) : (
                            <img src="/images/resume-scan-2.gif" alt="" className='w-fit'/>
                        )
                    }
                </section>
            </div>
        </main>
    );
};

export default memo(Resume);