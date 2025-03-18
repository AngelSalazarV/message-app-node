import ContainerMessageText from './ContainerMessageText';
import ContainerMessageHeader from './ContainerMessageHeader';


function ContainerMessage({ contact }) {
  const username = contact.username ? contact.username : contact.users.username
  const contactToSend =  contact.contact_id 
  return(
    <section className="flex flex-col w-full h-screen">
      <ContainerMessageHeader name={username} />
      <ContainerMessageText receivedId={contactToSend}/>
    </section>
  )
}
export default ContainerMessage;