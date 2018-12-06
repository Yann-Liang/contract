const { getCandidateList, candidateDetails, candidateDeposit, verifiersList, candidateWithdrawInfos, setCandidateExtra, candidateApplyWithdraw, candidateWithdraw} = require ('./lib/validation');


const result = getCandidateList();

candidateDeposit()

candidateDetails()

verifiersList()

candidateWithdrawInfos()

setTimeout(() => {
    setCandidateExtra()

    candidateApplyWithdraw()

    //  setTimeout(() => {
    //     candidateWithdraw ();
    // },4000)
},4000)
