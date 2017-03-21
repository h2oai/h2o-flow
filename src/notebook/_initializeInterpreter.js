import { postScalaIntpRequest } from '../h2oProxy/postScalaIntpRequest';

// initialize the interpreter when the notebook is created
// one interpreter is shared by all scala cells
export function _initializeInterpreter(_) {
  return postScalaIntpRequest(_, (error, response) => {
    if (error) {
        // Handle the error
      return _.scalaIntpId(-1);
    }
    console.log('response from notebook _initializeInterpreter', response);
    return _.scalaIntpId(response.session_id);
  });
}
