import ContainerMessageText from './ContainerMessageText';
import ContainerMessageHeader from './ContainerMessageHeader';


function ContainerMessage({contact}) {
  return(
    <section className="flex flex-col w-full h-screen">
      <ContainerMessageHeader name={contact} />
      <ContainerMessageText />
    </section>
  )
}
export default ContainerMessage;