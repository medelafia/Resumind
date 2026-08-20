import { memo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import FileUploader from '~/components/file-uploader';
import Navbar from '~/components/navbar';
import { prepareInstructions } from '~/constants';
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

const Upload = () => {
    const [isProcessing , setIsProcessing] = useState(false)    
    const [statusText , setStatusText] = useState('')
    const [file , setFile] = useState<File|null>()
    const {ai, kv, fs} = usePuterStore()
    const navigate = useNavigate()


    const analyseResume = async ({jobTitle, jobDescription,companyName, file } : {jobTitle : any, jobDescription : any , companyName? : any , file : File}) => {
        setIsProcessing(true) 
        setStatusText("Uploading pdf now...")

        const uploadedFile = await fs.upload([file]) 

        if(!uploadedFile) return setStatusText('Error: Failed to upload file')

        setStatusText('Converting to image ...')

        const imageFile = await convertPdfToImage(file) 

        console.log(imageFile.error)
        if(!imageFile.file) return setStatusText('Error: Failed to convert pdf to image')

        setStatusText("Uploading image now...");

        const uploadedImage = await fs.upload([imageFile.file]) ; 

        if(!uploadedImage) return setStatusText('Error: Failed to upload image'); 
        
        setStatusText('Preparing data...')


        const uuid = generateUUID()
        const data = {
            id: uuid , 
            resumePath : uploadedFile.path , 
            imagePath : uploadedImage.path, 
            companyName, jobTitle, jobDescription, 
            feedback : ''
        }

        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText('Analysing...')
        const feedback = await ai.feedback(
            uploadedImage.path, 
            prepareInstructions({jobTitle, jobDescription})
        )

        if(!feedback) return setStatusText('Error: Failed to get feedback'); 

        const feedbackText = typeof feedback.message.content === 'string' 
                                ? feedback.message.content 
                                : feedback.message.content[0].text ; 

        
        data.feedback = JSON.parse(feedbackText) 
        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText('Analysis complete, redirecting...')

        navigate(`/resume/${uuid}`)
    }


    const handleSubmit = (e : FormEvent<HTMLFormElement> ) => { 
        e.preventDefault() 

        const form = (e.target as HTMLFormElement).closest("form")
        if(!form) return; 

        const formData = new FormData(form) 

        const companyName = formData.get("company-name") ; 
        const jobTitle = formData.get("job-title") ; 
        const jobDescription = formData.get("job-description") ; 


        if(!file) return 

        if(companyName != null && jobTitle != null )
        analyseResume({companyName, jobTitle, jobDescription, file})

    }

    const handleFileSelect = (file :File | null) => { 
        setFile(file)
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className='main-section'>
                <div className='page-heading py-16'>
                    <h1>Smart feedback for your dream job</h1>
                    {
                        isProcessing ? (
                            <>
                                <h2>{statusText}</h2>
                                <img src='/images/resume-scan.gif' alt='resume-gif' className='w-[500px]'/>
                            </>
                        ): (
                            <h2>Drop your resume for an ATS score and imporvement tips</h2>
                        )
                    }
                    { 
                        !isProcessing && (
                            <form id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
                                <div className='form-div' >
                                    <label htmlFor="company-name">Company Name</label>
                                    <input type="text" placeholder='Company Name' name='company-name' id='company-name' />
                                </div>
                                <div className='form-div' >
                                    <label htmlFor="job-title">Job Title</label>
                                    <input type="text" placeholder='Job Title' name='job-title' id='job-title' />
                                </div>
                                <div className='form-div' >
                                    <label htmlFor="job-description">Job Description</label>
                                    <textarea rows={5} placeholder='Job Description' name='job-description' id='job-description' />
                                </div>
                                <div className='form-div' >
                                    <label htmlFor="upload-resume">Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>
                                <button className='primary-button' type='submit'>
                                    Analyse Resume
                                </button>
                            </form>
                        )
                    }
                </div>
                
            </section>
        </main>
    );
};

export default memo(Upload);